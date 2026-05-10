import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { useSettings } from "@/hooks/use-settings";
import { useTheme, type Theme } from "@/contexts/theme-context";
import { useListAudioFiles, getListAudioFilesQueryKey } from "@workspace/api-client-react";
import { useElectron, getApiBase } from "@/hooks/use-electron";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Upload, CheckCircle, Music2, FolderOpen, RefreshCw, Palette,
  Settings2, Volume2, Monitor, HardDrive, ExternalLink, FileText,
} from "lucide-react";

const themes: { id: Theme; label: string; desc: string; preview: string }[] = [
  {
    id: "dark-blue",
    label: "Dark Blue Premium",
    desc: "Navy escuro com azul neon",
    preview: "bg-gradient-to-br from-[hsl(221_44%_7%)] to-[hsl(212_59%_15%)]",
  },
  {
    id: "worship-purple",
    label: "Worship Purple",
    desc: "Escuro com roxo vibrante",
    preview: "bg-gradient-to-br from-[hsl(265_30%_6%)] to-[hsl(270_40%_15%)]",
  },
  {
    id: "light-modern",
    label: "Light Modern",
    desc: "Claro e moderno",
    preview: "bg-gradient-to-br from-slate-100 to-slate-200",
  },
];

const fontSizes = [
  { id: "small", label: "Pequeno" },
  { id: "medium", label: "Médio" },
  { id: "large", label: "Grande" },
  { id: "xl", label: "Extra Grande" },
] as const;

const backgrounds = [
  { id: "black", label: "Preto Puro" },
  { id: "dark-blue", label: "Azul Escuro" },
  { id: "gradient", label: "Gradiente" },
] as const;

const transitions = [
  { id: "fade", label: "Fade" },
  { id: "slide", label: "Slide" },
  { id: "scale", label: "Escala" },
] as const;

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const { theme, setTheme } = useTheme();
  const [saved, setSaved] = useState(false);
  const [folderChanging, setFolderChanging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<{
    scanned: number; linked: number; lyrics: number; removed: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const electron = useElectron();

  const { data: audioFiles, refetch: refetchAudio } = useListAudioFiles({
    query: { queryKey: getListAudioFilesQueryKey() },
  });

  // Listen for scan-complete events pushed from the Electron main process
  useEffect(() => {
    if (!electron.onScanComplete) return;
    electron.onScanComplete((result) => {
      setLastScanResult(result);
      void refetchAudio();
    });
    return () => {
      electron.removeAllListeners?.("music-scan-complete");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = (partial: Parameters<typeof updateSettings>[0]) => {
    updateSettings(partial);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSelectFolder = async () => {
    if (!electron.selectFolder) return;
    setFolderChanging(true);
    try {
      const folder = await electron.selectFolder();
      if (!folder) return;
      handleSave({ musicasFolder: folder });

      if (electron.setMusicFolder) {
        await electron.setMusicFolder(folder);
      } else {
        await fetch(`${getApiBase()}/api/audio/watch-folder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder }),
        });
      }
      await refetchAudio();
    } finally {
      setFolderChanging(false);
    }
  };

  const handleScanAudio = async () => {
    setScanning(true);
    setLastScanResult(null);
    try {
      let result: { scanned: number; linked: number; lyrics?: number; removed?: number };

      if (electron.scanMusic) {
        result = await electron.scanMusic();
      } else {
        const resp = await fetch(`${getApiBase()}/api/audio/scan`, { method: "POST" });
        result = await resp.json();
      }

      setLastScanResult({
        scanned: result.scanned,
        linked: result.linked,
        lyrics: result.lyrics ?? 0,
        removed: result.removed ?? 0,
      });
      await refetchAudio();
    } finally {
      setScanning(false);
    }
  };

  const handleOpenFolder = async () => {
    if (electron.openMusicFolder) {
      await electron.openMusicFolder();
    }
  };

  const mp3Count = audioFiles?.filter((f) => f.type === "mp3").length ?? 0;
  const pbCount = audioFiles?.filter((f) => f.type === "pb").length ?? 0;
  const lyricsCount = audioFiles?.filter((f) => f.type === "lyrics").length ?? 0;
  const linkedCount = audioFiles?.filter((f) => f.songId != null).length ?? 0;

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-card border-b border-border flex items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p className="text-sm text-muted-foreground">Personalize o ChurchLive para sua congregação</p>
          </div>
          {saved && (
            <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Salvo com sucesso
            </div>
          )}
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Church Identity */}
            <Card className="border-border bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings2 className="w-5 h-5 text-primary" />
                  Identidade da Igreja
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Nome da Igreja</Label>
                    <Input
                      value={settings.churchName}
                      onChange={(e) => handleSave({ churchName: e.target.value })}
                      placeholder="Ex: Igreja Adventista Central"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Congregação</Label>
                    <Input
                      value={settings.congregationName}
                      onChange={(e) => handleSave({ congregationName: e.target.value })}
                      placeholder="Ex: Congregação Norte"
                      className="bg-background border-border"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Logo da Igreja</Label>
                  <div className="flex items-center gap-4">
                    {settings.logoUrl ? (
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-border">
                        <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain bg-background" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                        <Upload className="w-6 h-6" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" />
                        {settings.logoUrl ? "Trocar Logo" : "Enviar Logo"}
                      </Button>
                      {settings.logoUrl && (
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleSave({ logoUrl: null })}>
                          Remover
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">PNG, JPG ou SVG. Máx. 2MB.</p>
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => handleSave({ logoUrl: ev.target?.result as string });
                    reader.readAsDataURL(file);
                  }} />
                </div>
              </CardContent>
            </Card>

            {/* Themes */}
            <Card className="border-border bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Palette className="w-5 h-5 text-primary" />
                  Tema da Interface
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setTheme(t.id); handleSave({ theme: t.id }); }}
                      className={cn(
                        "rounded-xl border-2 overflow-hidden transition-all text-left",
                        theme === t.id
                          ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className={cn("h-20 w-full", t.preview)} />
                      <div className="p-3 bg-card">
                        <div className="font-semibold text-sm">{t.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
                        {theme === t.id && <Badge className="mt-2 text-xs">Ativo</Badge>}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Projection Settings */}
            <Card className="border-border bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Monitor className="w-5 h-5 text-primary" />
                  Configurações de Projeção
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Tamanho da Fonte</Label>
                  <div className="flex gap-2">
                    {fontSizes.map((fs) => (
                      <button
                        key={fs.id}
                        onClick={() => handleSave({ projectionFontSize: fs.id })}
                        className={cn(
                          "flex-1 py-2 rounded-lg border text-sm font-medium transition-all",
                          settings.projectionFontSize === fs.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50 text-muted-foreground"
                        )}
                      >
                        {fs.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Fundo da Projeção</Label>
                  <div className="flex gap-2">
                    {backgrounds.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => handleSave({ projectionBackground: bg.id })}
                        className={cn(
                          "flex-1 py-2 rounded-lg border text-sm font-medium transition-all",
                          settings.projectionBackground === bg.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50 text-muted-foreground"
                        )}
                      >
                        {bg.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Transição de Estrofes</Label>
                  <div className="flex gap-2">
                    {transitions.map((tr) => (
                      <button
                        key={tr.id}
                        onClick={() => handleSave({ projectionTransition: tr.id })}
                        className={cn(
                          "flex-1 py-2 rounded-lg border text-sm font-medium transition-all",
                          settings.projectionTransition === tr.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50 text-muted-foreground"
                        )}
                      >
                        {tr.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audio Settings */}
            <Card className="border-border bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Volume2 className="w-5 h-5 text-primary" />
                  Configurações de Áudio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Áudio Habilitado</div>
                    <div className="text-sm text-muted-foreground">Permite reprodução de MP3 junto com a letra</div>
                  </div>
                  <Switch
                    checked={settings.audioEnabled}
                    onCheckedChange={(v) => handleSave({ audioEnabled: v })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Volume Padrão</Label>
                    <span className="text-sm font-mono text-muted-foreground">{settings.audioDefaultVolume}%</span>
                  </div>
                  <Slider
                    value={[settings.audioDefaultVolume]}
                    onValueChange={([v]) => handleSave({ audioDefaultVolume: v })}
                    max={100}
                    step={1}
                    className="w-full"
                    disabled={!settings.audioEnabled}
                  />
                </div>
              </CardContent>
            </Card>

            {/* MP3 / Music Folder */}
            <Card className="border-border bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Music2 className="w-5 h-5 text-primary" />
                  Biblioteca de Músicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Folder path display */}
                <div className="flex items-center gap-3 bg-background border border-border rounded-lg px-4 py-3">
                  <FolderOpen className="w-5 h-5 text-muted-foreground shrink-0" />
                  <code className="text-sm text-muted-foreground flex-1 truncate">
                    {settings.musicasFolder || "config/musicas"}
                  </code>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {mp3Count > 0 && (
                      <Badge variant="secondary" className="text-xs">{mp3Count} MP3</Badge>
                    )}
                    {pbCount > 0 && (
                      <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-400">{pbCount} PB</Badge>
                    )}
                    {lyricsCount > 0 && (
                      <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">{lyricsCount} TXT</Badge>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                {electron.isElectron ? (
                  <p className="text-sm text-muted-foreground">
                    Clique em <strong>Selecionar Pasta</strong> para escolher a pasta com seus MP3.
                    Arquivos com <code className="bg-muted px-1 rounded text-xs">- PB.mp3</code> são detectados como playback.
                    Arquivos <code className="bg-muted px-1 rounded text-xs">.txt</code> são importados como letras.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Coloque arquivos MP3 na pasta{" "}
                    <code className="bg-muted px-1 rounded text-xs">config/musicas/</code> (subpastas são incluídas).
                    Adicione <code className="bg-muted px-1 rounded text-xs">- PB.mp3</code> ao nome para marcar como playback.
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 flex-wrap">
                  {electron.isElectron && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectFolder}
                        disabled={folderChanging}
                      >
                        <HardDrive className={cn("w-4 h-4 mr-2", folderChanging && "animate-pulse")} />
                        {folderChanging ? "Selecionando..." : "Selecionar Pasta"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenFolder}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir no Explorer
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleScanAudio}
                    disabled={scanning}
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", scanning && "animate-spin")} />
                    {scanning ? "Escaneando..." : "Escanear e Vincular"}
                  </Button>
                </div>

                {/* Last scan result */}
                {lastScanResult && (
                  <div className="flex items-center gap-4 text-sm bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">
                      Escaneados: <strong className="text-foreground">{lastScanResult.scanned}</strong>
                      {" · "}Vinculados: <strong className="text-foreground">{lastScanResult.linked}</strong>
                      {lastScanResult.lyrics > 0 && (
                        <>{" · "}Letras: <strong className="text-foreground">{lastScanResult.lyrics}</strong></>
                      )}
                      {lastScanResult.removed > 0 && (
                        <>{" · "}Removidos: <strong className="text-foreground">{lastScanResult.removed}</strong></>
                      )}
                    </span>
                  </div>
                )}

                {/* File list */}
                {audioFiles && audioFiles.length > 0 && (
                  <div className="mt-2 border border-border rounded-lg overflow-hidden">
                    {/* Summary stats row */}
                    {linkedCount > 0 && (
                      <div className="px-4 py-2 bg-muted/30 border-b border-border/50 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{audioFiles.length} arquivo(s) indexado(s)</span>
                        <span>·</span>
                        <span className="text-primary font-medium">{linkedCount} vinculado(s)</span>
                        {audioFiles.length - linkedCount > 0 && (
                          <>
                            <span>·</span>
                            <span>{audioFiles.length - linkedCount} sem vínculo</span>
                          </>
                        )}
                      </div>
                    )}
                    {audioFiles.slice(0, 15).map((f) => (
                      <div
                        key={f.path ?? f.filename}
                        className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 last:border-0 hover:bg-white/5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {f.type === "lyrics" ? (
                            <FileText className="w-4 h-4 text-yellow-500/70 shrink-0" />
                          ) : (
                            <Music2 className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{f.title}</div>
                            <div className="text-xs text-muted-foreground truncate">{f.filename}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {f.type === "pb" && (
                            <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-400">Playback</Badge>
                          )}
                          {f.type === "lyrics" && (
                            <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">Letra</Badge>
                          )}
                          {f.songId != null ? (
                            <Badge className="text-xs">Vinculado</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">Não vinculado</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {audioFiles.length > 15 && (
                      <div className="px-4 py-2 text-xs text-muted-foreground text-center">
                        +{audioFiles.length - 15} arquivo(s) adicionais
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}
