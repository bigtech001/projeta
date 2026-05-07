import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { useSettings } from "@/hooks/use-settings";
import { useTheme, type Theme } from "@/contexts/theme-context";
import { useScanAudioFiles, useListAudioFiles, getListAudioFilesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Upload, CheckCircle, Music2, FolderOpen, RefreshCw, Palette, Settings2, Volume2, Monitor } from "lucide-react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: audioFiles, refetch: refetchAudio } = useListAudioFiles({
    query: { queryKey: getListAudioFilesQueryKey() },
  });
  const scanAudio = useScanAudioFiles();

  const handleSave = (partial: Parameters<typeof updateSettings>[0]) => {
    updateSettings(partial);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      handleSave({ logoUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleScanAudio = async () => {
    await scanAudio.mutateAsync(undefined as unknown as void);
    refetchAudio();
  };

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
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
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
                      onClick={() => {
                        setTheme(t.id);
                        handleSave({ theme: t.id });
                      }}
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
                        {theme === t.id && (
                          <Badge className="mt-2 text-xs">Ativo</Badge>
                        )}
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
                        onClick={() => {
                          handleSave({ projectionFontSize: fs.id });
                        }}
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
                        onClick={() => {
                          handleSave({ projectionBackground: bg.id });
                        }}
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
                        onClick={() => {
                          handleSave({ projectionTransition: tr.id });
                        }}
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
                  Pasta de Músicas (MP3)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 bg-background border border-border rounded-lg px-4 py-3">
                  <FolderOpen className="w-5 h-5 text-muted-foreground shrink-0" />
                  <code className="text-sm text-muted-foreground flex-1">config/musicas/</code>
                  <Badge variant="outline" className="text-xs">
                    {audioFiles?.length ?? 0} arquivo(s)
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Coloque arquivos MP3 na pasta <code className="bg-muted px-1 rounded text-xs">config/musicas/</code> no servidor.
                  O nome do arquivo deve corresponder ao título da música para vinculação automática.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleScanAudio}
                    disabled={scanAudio.isPending}
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-2", scanAudio.isPending && "animate-spin")} />
                    {scanAudio.isPending ? "Escaneando..." : "Escanear e Vincular"}
                  </Button>
                </div>

                {audioFiles && audioFiles.length > 0 && (
                  <div className="mt-2 border border-border rounded-lg overflow-hidden">
                    {audioFiles.slice(0, 10).map((f) => (
                      <div key={f.filename} className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 last:border-0 hover:bg-white/5">
                        <div className="flex items-center gap-3">
                          <Music2 className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div>
                            <div className="text-sm font-medium">{f.title}</div>
                            <div className="text-xs text-muted-foreground">{f.filename}</div>
                          </div>
                        </div>
                        {f.songId ? (
                          <Badge className="text-xs">Vinculado</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">Não vinculado</Badge>
                        )}
                      </div>
                    ))}
                    {audioFiles.length > 10 && (
                      <div className="px-4 py-2 text-xs text-muted-foreground text-center">
                        +{audioFiles.length - 10} arquivo(s) adicionais
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
