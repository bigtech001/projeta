import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { MonitorPlay, LayoutDashboard, Library, Music, BookOpen, ListOrdered, Settings } from "lucide-react";
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
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
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
                <item.icon className={cn("w-5 h-5 mr-3 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-muted-foreground rounded-md hover:bg-white/5 hover:text-foreground transition-colors">
            <Settings className="w-5 h-5 mr-3" />
            Configurações
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
