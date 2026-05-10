import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { MonitorPlay, LayoutDashboard, Library, Music, BookOpen, ListOrdered, Settings, Monitor, Mic2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();

  const navigation = [
    { name: "Início", href: "/", icon: LayoutDashboard },
    { name: "Operador", href: "/operator", icon: MonitorPlay },
    { name: "Músicas", href: "/songs", icon: Music },
    { name: "Coletâneas", href: "/collections", icon: Library },
    { name: "Bíblia", href: "/bible", icon: BookOpen },
    { name: "Liturgia", href: "/liturgy", icon: ListOrdered },
  ];

  const openProjection = () => {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    window.open(
      `${base}/projection`,
      "projection-screen",
      "toolbar=no,menubar=no,scrollbars=no,resizable=yes,width=1280,height=720"
    );
  };

  const openStage = () => {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    window.open(
      `${base}/stage`,
      "stage-monitor",
      "toolbar=no,menubar=no,scrollbars=no,resizable=yes,width=1024,height=640"
    );
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col z-10 shadow-lg">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center mr-3 shadow-md shadow-primary/20">
            <MonitorPlay className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">ChurchLive</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive =
              location === item.href ||
              (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-md transition-all duration-200 group text-sm font-medium",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
                data-testid={`nav-${item.name.toLowerCase()}`}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 mr-3 transition-colors",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Quick Launch Buttons */}
        <div className="px-3 pb-3 space-y-1 border-t border-border pt-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-3 mb-2">
            Abrir em nova janela
          </p>
          <button
            onClick={openProjection}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-white/5 hover:text-primary transition-colors"
          >
            <Monitor className="w-4 h-4 mr-3 shrink-0" />
            Tela de Projeção
          </button>
          <button
            onClick={openStage}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-white/5 hover:text-primary transition-colors"
          >
            <Mic2 className="w-4 h-4 mr-3 shrink-0" />
            Monitor de Palco
          </button>
        </div>

        <div className="p-4 border-t border-border">
          <Link
            href="/settings"
            className={cn(
              "flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
              location === "/settings"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
          >
            <Settings className="w-5 h-5 mr-3" />
            Configurações
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
