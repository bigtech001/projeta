import { useState } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { useWebSocket } from "@/hooks/use-websocket";
import { 
  useGetProjectionState, 
  getGetProjectionStateQueryKey,
  useControlProjection,
  useListSongs,
  getListSongsQueryKey,
  useGetSongVerses,
  getGetSongVersesQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Play, Pause, Square, ChevronLeft, ChevronRight, SkipBack, MonitorX, MonitorPlay } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Operator() {
  const wsState = useWebSocket();
  const { data: pollState, refetch } = useGetProjectionState({
    query: {
      queryKey: getGetProjectionStateQueryKey(),
      refetchInterval: 2000,
    }
  });

  const state = wsState || pollState;
  const controlProjection = useControlProjection();

  const [search, setSearch] = useState("");
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);

  const { data: songs, isLoading: isLoadingSongs } = useListSongs({ search }, {
    query: {
      queryKey: getListSongsQueryKey({ search })
    }
  });

  const activeSongId = selectedSongId || state?.currentSongId;

  const { data: verses, isLoading: isLoadingVerses } = useGetSongVerses(activeSongId!, {
    query: {
      enabled: !!activeSongId,
      queryKey: getGetSongVersesQueryKey(activeSongId!)
    }
  });

  const handleShowSong = (songId: number) => {
    controlProjection.mutate({
      data: {
        action: "show_song",
        songId,
        verseIndex: 0
      }
    });
    setSelectedSongId(songId);
  };

  const handleNextVerse = () => {
    controlProjection.mutate({ data: { action: "next_verse" } });
  };

  const handlePrevVerse = () => {
    controlProjection.mutate({ data: { action: "prev_verse" } });
  };

  const handleShowVerse = (verseIndex: number) => {
    if (activeSongId) {
      controlProjection.mutate({
        data: {
          action: "show_song",
          songId: activeSongId,
          verseIndex
        }
      });
    }
  };

  const handleBlank = () => {
    controlProjection.mutate({ data: { action: "blank" } });
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Top Status Bar */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={cn("w-3 h-3 rounded-full", wsState ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]")} />
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {wsState ? "Conectado" : "Polling"}
              </span>
            </div>
            <div className="h-4 w-px bg-border mx-2" />
            <span className="text-sm font-bold">
              Modo: <span className="text-primary">{state?.mode?.toUpperCase() || "NENHUM"}</span>
            </span>
          </div>

          <div className="flex space-x-2">
            <Button variant="destructive" size="sm" onClick={handleBlank} data-testid="btn-blank">
              <MonitorX className="w-4 h-4 mr-2" />
              Limpar Tela
            </Button>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel: Songs List */}
          <div className="w-1/3 max-w-sm border-r border-border bg-background flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar louvor..." 
                  className="pl-9 bg-card border-border"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-song"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {isLoadingSongs ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-md" />
                  ))
                ) : songs?.length ? (
                  songs.map(song => (
                    <div 
                      key={song.id}
                      className={cn(
                        "p-3 rounded-md cursor-pointer transition-colors flex justify-between items-center group",
                        activeSongId === song.id ? "bg-primary/20 border border-primary/30" : "hover:bg-white/5 border border-transparent"
                      )}
                      onClick={() => setSelectedSongId(song.id)}
                      data-testid={`song-item-${song.id}`}
                    >
                      <div>
                        <div className="font-medium text-sm text-foreground">{song.title}</div>
                        <div className="text-xs text-muted-foreground">{song.author}</div>
                      </div>
                      <Button 
                        size="icon" 
                        variant={state?.currentSongId === song.id ? "default" : "ghost"}
                        className={cn("opacity-0 group-hover:opacity-100 transition-opacity", state?.currentSongId === song.id && "opacity-100")}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowSong(song.id);
                        }}
                      >
                        <MonitorPlay className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    Nenhum louvor encontrado
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Center Panel: Lyrics Control */}
          <div className="flex-1 flex flex-col bg-card/50">
            <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card shrink-0">
              <h2 className="text-lg font-bold truncate pr-4">
                {songs?.find(s => s.id === activeSongId)?.title || "Selecione um louvor"}
              </h2>
              
              <div className="flex space-x-2 shrink-0">
                <Button variant="outline" size="sm" onClick={handlePrevVerse} disabled={!state?.currentSongId}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextVerse} disabled={!state?.currentSongId}>
                  Próximo <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6">
              {isLoadingVerses ? (
                <div className="space-y-4 max-w-2xl mx-auto">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : verses?.length ? (
                <div className="space-y-4 max-w-3xl mx-auto pb-20">
                  {verses.map((verse, idx) => {
                    const isCurrent = state?.currentSongId === activeSongId && state?.currentVerseIndex === verse.index;
                    return (
                      <Card 
                        key={idx}
                        className={cn(
                          "cursor-pointer transition-all overflow-hidden border-2",
                          isCurrent ? "border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-[1.02]" : "border-border hover:border-primary/50 hover:bg-white/5"
                        )}
                        onClick={() => handleShowVerse(verse.index)}
                        data-testid={`verse-item-${verse.index}`}
                      >
                        <div className="flex">
                          <div className={cn(
                            "w-12 flex flex-col items-center py-4 font-mono text-sm font-bold border-r",
                            isCurrent ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-muted-foreground"
                          )}>
                            {verse.label || (verse.index + 1)}
                          </div>
                          <div className="p-4 flex-1">
                            {verse.lines.map((line, i) => (
                              <div key={i} className={cn(
                                "text-lg",
                                isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
                              )}>{line}</div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Selecione um louvor na lista para ver as estrofes
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right Panel: Audio/Extras */}
          <div className="w-72 border-l border-border bg-background flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Controles de Áudio</h3>
              
              <div className="flex justify-center space-x-3 mb-6">
                <Button size="icon" variant="outline" className="h-12 w-12 rounded-full hover:text-primary hover:border-primary">
                  <SkipBack className="h-5 w-5" fill="currentColor" />
                </Button>
                <Button size="icon" className="h-14 w-14 rounded-full shadow-lg shadow-primary/20">
                  <Play className="h-6 w-6 ml-1" fill="currentColor" />
                </Button>
                <Button size="icon" variant="outline" className="h-12 w-12 rounded-full hover:text-destructive hover:border-destructive">
                  <Square className="h-5 w-5" fill="currentColor" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Volume</span>
                  <span>75%</span>
                </div>
                <Slider defaultValue={[75]} max={100} step={1} className="w-full" />
              </div>
            </div>

            <div className="p-4 flex-1">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">Ações Rápidas</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">Mostrar Relógio</Button>
                <Button variant="outline" className="w-full justify-start">Exibir Contagem</Button>
                <Button variant="outline" className="w-full justify-start">Aviso na Tela</Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
}