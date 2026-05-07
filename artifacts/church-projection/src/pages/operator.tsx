import { useState, useEffect, useRef, useCallback } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { useWebSocket } from "@/hooks/use-websocket";
import {
  useGetProjectionState,
  getGetProjectionStateQueryKey,
  useControlProjection,
  useListSongs,
  getListSongsQueryKey,
  useGetSongVerses,
  getGetSongVersesQueryKey,
  useGetLiturgy,
  getGetLiturgyQueryKey,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Search, Play, Pause, Square, ChevronLeft, ChevronRight, SkipBack,
  MonitorX, MonitorPlay, Monitor, Mic2, Keyboard, Music, FileText, Headphones, Tv, ArrowRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/use-settings";

type PlaybackMode = "lyrics-only" | "lyrics-playback" | "lyrics-audio";

interface PlaybackModeOption {
  id: PlaybackMode;
  label: string;
  desc: string;
  icon: typeof FileText;
}

const PLAYBACK_MODES: PlaybackModeOption[] = [
  { id: "lyrics-only", label: "Somente Letras", desc: "Exibe apenas a letra na projeção", icon: FileText },
  { id: "lyrics-playback", label: "Letras + Playback", desc: "Letra com controles de reprodução de áudio", icon: Music },
  { id: "lyrics-audio", label: "Letras + Áudio Cantado", desc: "Letra com MP3 da versão cantada", icon: Headphones },
];

export default function Operator() {
  const wsState = useWebSocket();
  const { data: pollState } = useGetProjectionState({
    query: {
      queryKey: getGetProjectionStateQueryKey(),
      refetchInterval: 2000,
    },
  });

  const state = wsState ?? pollState;
  const controlProjection = useControlProjection();
  const { settings } = useSettings();

  const [search, setSearch] = useState("");
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("lyrics-only");
  const [pendingSongId, setPendingSongId] = useState<number | null>(null);
  const [showModeDialog, setShowModeDialog] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [volume, setVolume] = useState(settings.audioDefaultVolume);
  const [isPlaying, setIsPlaying] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  const { data: songs, isLoading: isLoadingSongs } = useListSongs({ search }, {
    query: { queryKey: getListSongsQueryKey({ search }) },
  });

  const activeSongId = selectedSongId ?? state?.currentSongId ?? null;

  const { data: verses, isLoading: isLoadingVerses } = useGetSongVerses(activeSongId!, {
    query: {
      enabled: !!activeSongId,
      queryKey: getGetSongVersesQueryKey(activeSongId!),
    },
  });

  const liturgyId = state?.currentLiturgyId ?? null;
  const { data: liturgy } = useGetLiturgy(liturgyId!, {
    query: { enabled: !!liturgyId, queryKey: getGetLiturgyQueryKey(liturgyId!) },
  });

  const handleShowSong = useCallback((songId: number, mode?: PlaybackMode) => {
    const m = mode ?? playbackMode;
    controlProjection.mutate({ data: { action: "show_song", songId, verseIndex: 0 } });
    setSelectedSongId(songId);
    if (m === "lyrics-playback" || m === "lyrics-audio") {
      setIsPlaying(true);
      controlProjection.mutate({ data: { action: "play_audio" } });
    }
  }, [playbackMode, controlProjection]);

  const handleNextVerse = useCallback(() => {
    controlProjection.mutate({ data: { action: "next_verse" } });
  }, [controlProjection]);

  const handlePrevVerse = useCallback(() => {
    controlProjection.mutate({ data: { action: "prev_verse" } });
  }, [controlProjection]);

  const handleShowVerse = useCallback((verseIndex: number) => {
    if (activeSongId) {
      controlProjection.mutate({ data: { action: "show_song", songId: activeSongId, verseIndex } });
    }
  }, [activeSongId, controlProjection]);

  const handleBlank = useCallback(() => {
    controlProjection.mutate({ data: { action: "blank" } });
  }, [controlProjection]);

  const handleVolumeChange = useCallback((v: number) => {
    setVolume(v);
    controlProjection.mutate({ data: { action: "set_volume", volume: v } });
  }, [controlProjection]);

  const openProjection = useCallback(() => {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    window.open(`${base}/projection`, "projection-screen", "toolbar=no,menubar=no,scrollbars=no,resizable=yes,width=1280,height=720");
  }, []);

  const openStage = useCallback(() => {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    window.open(`${base}/stage`, "stage-monitor", "toolbar=no,menubar=no,scrollbars=no,resizable=yes,width=1024,height=640");
  }, []);

  const onSongClick = (songId: number) => {
    setSelectedSongId(songId);
  };

  const onSongDoubleClick = (songId: number) => {
    setPendingSongId(songId);
    setShowModeDialog(true);
  };

  const onConfirmMode = (mode: PlaybackMode) => {
    setPlaybackMode(mode);
    setShowModeDialog(false);
    if (pendingSongId) {
      handleShowSong(pendingSongId, mode);
      setPendingSongId(null);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (isInput) return;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          handleNextVerse();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          handlePrevVerse();
          break;
        case " ":
          e.preventDefault();
          handleBlank();
          break;
        case "Escape":
          handleBlank();
          break;
        case "p":
        case "P":
          openProjection();
          break;
        case "s":
        case "S":
          openStage();
          break;
        case "f":
        case "F":
          if (!e.ctrlKey && !e.metaKey) {
            searchRef.current?.focus();
          }
          break;
        case "?":
          setShowShortcuts((v) => !v);
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNextVerse, handlePrevVerse, handleBlank, openProjection, openStage]);

  const currentSong = songs?.find((s) => s.id === activeSongId);
  const currentLiturgyItems = liturgy?.items ?? [];
  const currentLiturgyItemIndex = currentLiturgyItems.findIndex((i) => i.songId === state?.currentSongId);

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Top Status Bar */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={cn("w-2.5 h-2.5 rounded-full", wsState ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]")} />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {wsState ? "WS Conectado" : "Polling"}
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <span className="text-sm font-bold">
              Modo: <span className="text-primary">{state?.mode?.toUpperCase() ?? "NENHUM"}</span>
            </span>
            {state?.currentSongTitle && (
              <>
                <div className="h-4 w-px bg-border" />
                <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {state.currentSongTitle}
                </span>
                {state.totalVerses != null && state.currentVerseIndex != null && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {state.currentVerseIndex + 1}/{state.totalVerses}
                  </Badge>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={openStage} title="Abrir Monitor de Palco (S)">
              <Mic2 className="w-4 h-4 mr-1.5" />
              Palco
            </Button>
            <Button variant="ghost" size="sm" onClick={openProjection} title="Abrir Projeção (P)">
              <Monitor className="w-4 h-4 mr-1.5" />
              Projeção
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowShortcuts(true)} title="Atalhos de teclado (?)">
              <Keyboard className="w-4 h-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBlank}>
              <MonitorX className="w-4 h-4 mr-1.5" />
              Limpar (Espaço)
            </Button>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="flex-1 flex overflow-hidden">

          {/* Left: Song List */}
          <div className="w-[280px] border-r border-border bg-background flex flex-col shrink-0">
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  placeholder="Buscar louvor... (F)"
                  className="pl-9 bg-card border-border h-9 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-0.5">
                {isLoadingSongs ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-md" />
                  ))
                ) : songs?.length ? (
                  songs.map((song) => {
                    const isActive = activeSongId === song.id;
                    const isProjecting = state?.currentSongId === song.id;
                    return (
                      <div
                        key={song.id}
                        className={cn(
                          "p-3 rounded-md cursor-pointer transition-all border group",
                          isActive ? "bg-primary/15 border-primary/30" : "hover:bg-white/5 border-transparent hover:border-white/10"
                        )}
                        onClick={() => onSongClick(song.id)}
                        onDoubleClick={() => onSongDoubleClick(song.id)}
                        title="Clique para selecionar · Duplo clique para projetar"
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">{song.title}</div>
                            <div className="text-xs text-muted-foreground truncate">{song.author}</div>
                          </div>
                          <div className="flex items-center gap-1 ml-2 shrink-0">
                            {isProjecting && (
                              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            )}
                            <Button
                              size="icon"
                              variant={isProjecting ? "default" : "ghost"}
                              className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSongDoubleClick(song.id);
                              }}
                            >
                              <MonitorPlay className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-muted-foreground text-sm">
                    Nenhum louvor encontrado
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Center: Verses */}
          <div className="flex-1 flex flex-col bg-card/30 min-w-0">
            <div className="h-14 border-b border-border flex items-center justify-between px-5 bg-card shrink-0">
              <h2 className="text-base font-bold truncate pr-4">
                {currentSong?.title ?? "Selecione um louvor"}
              </h2>
              <div className="flex items-center gap-2 shrink-0">
                {playbackMode !== "lyrics-only" && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    {PLAYBACK_MODES.find(m => m.id === playbackMode)?.label}
                  </Badge>
                )}
                <Button variant="outline" size="sm" className="h-8" onClick={handlePrevVerse} disabled={!state?.currentSongId}>
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-xs ml-0.5 hidden sm:block">Anterior</span>
                </Button>
                <Button variant="outline" size="sm" className="h-8" onClick={handleNextVerse} disabled={!state?.currentSongId}>
                  <span className="text-xs mr-0.5 hidden sm:block">Próximo</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-5">
              {isLoadingVerses ? (
                <div className="space-y-4 max-w-2xl mx-auto">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : verses?.length ? (
                <div className="space-y-3 max-w-3xl mx-auto pb-16">
                  {verses.map((verse, idx) => {
                    const isCurrent =
                      state?.currentSongId === activeSongId &&
                      state?.currentVerseIndex === verse.index;
                    return (
                      <Card
                        key={idx}
                        className={cn(
                          "cursor-pointer transition-all overflow-hidden border-2",
                          isCurrent
                            ? "border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-[1.01]"
                            : "border-border hover:border-primary/40 hover:bg-white/5"
                        )}
                        onClick={() => handleShowVerse(verse.index)}
                      >
                        <div className="flex">
                          <div className={cn(
                            "w-10 flex flex-col items-center justify-center py-4 font-mono text-xs font-bold border-r shrink-0",
                            isCurrent ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-muted-foreground"
                          )}>
                            {verse.label || (verse.index + 1)}
                          </div>
                          <div className="p-4 flex-1">
                            {verse.lines.map((line, i) => (
                              <div key={i} className={cn(
                                "text-base leading-snug",
                                isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                              )}>
                                {line}
                              </div>
                            ))}
                          </div>
                          {isCurrent && (
                            <div className="flex items-center pr-4">
                              <Tv className="w-4 h-4 text-primary" />
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <MonitorPlay className="w-12 h-12 opacity-20" />
                  <p className="text-sm">Clique duas vezes em uma música para projetar</p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right: Audio + Quick Actions */}
          <div className="w-64 border-l border-border bg-background flex flex-col shrink-0">
            {/* Audio Controls */}
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">
                Controles de Áudio
              </h3>
              <div className="flex justify-center gap-3 mb-5">
                <Button size="icon" variant="outline" className="h-10 w-10 rounded-full">
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-lg shadow-primary/20"
                  disabled={playbackMode === "lyrics-only"}
                  onClick={() => {
                    setIsPlaying((p) => {
                      controlProjection.mutate({ data: { action: p ? "pause_audio" : "play_audio" } });
                      return !p;
                    });
                  }}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-10 w-10 rounded-full"
                  disabled={playbackMode === "lyrics-only"}
                  onClick={() => {
                    setIsPlaying(false);
                    controlProjection.mutate({ data: { action: "stop_audio" } });
                  }}
                >
                  <Square className="h-4 w-4" />
                </Button>
              </div>

              {playbackMode === "lyrics-only" && (
                <p className="text-xs text-muted-foreground text-center mb-3">
                  Modo: Somente Letras
                </p>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Volume</span>
                  <span className="font-mono">{volume}%</span>
                </div>
                <Slider
                  value={[volume]}
                  onValueChange={([v]) => handleVolumeChange(v)}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            {/* Liturgy Progress */}
            {currentLiturgyItems.length > 0 && (
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Liturgia
                </h3>
                <div className="space-y-1">
                  {currentLiturgyItems.slice(0, 5).map((item, i) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors",
                        i === currentLiturgyItemIndex ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground"
                      )}
                    >
                      {i === currentLiturgyItemIndex && <ArrowRight className="w-3 h-3 shrink-0" />}
                      <span className="truncate">{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="p-4 flex-1">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Ações Rápidas
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs h-9"
                  onClick={() => controlProjection.mutate({ data: { action: "show_announcement", announcement: "Seja bem-vindo!" } })}
                >
                  Aviso na Tela
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs h-9"
                  onClick={() => controlProjection.mutate({ data: { action: "blank" } })}
                >
                  <MonitorX className="w-3.5 h-3.5 mr-2" />
                  Limpar Projeção
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs h-9"
                  onClick={openProjection}
                >
                  <Monitor className="w-3.5 h-3.5 mr-2" />
                  Abrir Projeção
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs h-9"
                  onClick={openStage}
                >
                  <Mic2 className="w-3.5 h-3.5 mr-2" />
                  Abrir Palco
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Playback Mode Dialog */}
      <Dialog open={showModeDialog} onOpenChange={setShowModeDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Modo de Reprodução</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Escolha como a música será apresentada:
            </p>
            {PLAYBACK_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => onConfirmMode(mode.id)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left",
                  playbackMode === mode.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  playbackMode === mode.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <mode.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{mode.label}</div>
                  <div className="text-xs text-muted-foreground">{mode.desc}</div>
                </div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setShowModeDialog(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Atalhos de Teclado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {[
              ["→ / ↓", "Próxima estrofe"],
              ["← / ↑", "Estrofe anterior"],
              ["Espaço", "Limpar projeção"],
              ["Esc", "Limpar projeção"],
              ["F", "Focar busca"],
              ["P", "Abrir janela de projeção"],
              ["S", "Abrir monitor de palco"],
              ["?", "Mostrar esta ajuda"],
            ].map(([key, desc]) => (
              <div key={key} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                <span className="text-sm text-muted-foreground">{desc}</span>
                <kbd className="px-2 py-0.5 bg-muted border border-border rounded text-xs font-mono">{key}</kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
