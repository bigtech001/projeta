import { useLocation } from "wouter";
import { Link } from "wouter";
import { Music, BookOpen, Library, ListOrdered, MonitorPlay, Search, Settings } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { useClock } from "@/hooks/use-clock";
import { useGetStatsOverview, getGetStatsOverviewQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [, setLocation] = useLocation();
  const { timeStr, dateStr } = useClock();
  const { data: stats, isLoading } = useGetStatsOverview({ query: { queryKey: getGetStatsOverviewQueryKey() } });

  const quickLinks = [
    { title: "Louvores", icon: Music, href: "/songs", color: "bg-blue-500/10 text-blue-500" },
    { title: "Bíblia", icon: BookOpen, href: "/bible", color: "bg-indigo-500/10 text-indigo-500" },
    { title: "Liturgia", icon: ListOrdered, href: "/liturgy", color: "bg-purple-500/10 text-purple-500" },
    { title: "Coletâneas", icon: Library, href: "/collections", color: "bg-pink-500/10 text-pink-500" },
  ];

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-8 relative">
        {/* Background glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          {/* Header Section */}
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">Painel Principal</h1>
              <p className="text-muted-foreground text-lg capitalize">{dateStr}</p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-light font-mono tracking-wider text-primary">{timeStr}</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button 
              size="lg" 
              className="h-24 md:col-span-4 text-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all font-semibold"
              onClick={() => setLocation("/operator")}
              data-testid="btn-start-service"
            >
              <MonitorPlay className="mr-3 h-6 w-6" />
              Iniciar Culto (Operador)
            </Button>

            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Card className="hover:bg-white/5 transition-colors cursor-pointer border-border hover:border-primary/50 group h-full">
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
                    <div className={`p-4 rounded-full ${link.color} group-hover:scale-110 transition-transform duration-300`}>
                      <link.icon className="w-8 h-8" />
                    </div>
                    <span className="font-medium text-lg">{link.title}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card/50 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="text-lg">Músicas</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-10 w-24 bg-white/5" />
                ) : (
                  <div className="text-4xl font-bold">{stats?.totalSongs || 0}</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="text-lg">Coletâneas</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-10 w-24 bg-white/5" />
                ) : (
                  <div className="text-4xl font-bold">{stats?.totalCollections || 0}</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="text-lg">Liturgias Salvas</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-10 w-24 bg-white/5" />
                ) : (
                  <div className="text-4xl font-bold">{stats?.totalLiturgies || 0}</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
