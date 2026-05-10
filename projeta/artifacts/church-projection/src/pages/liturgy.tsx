import { MainLayout } from "@/components/layout/main-layout";
import { useListLiturgies, getListLiturgiesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ListOrdered, Calendar, Clock, MoreHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Liturgy() {
  const { data: liturgies, isLoading } = useListLiturgies({
    query: {
      queryKey: getListLiturgiesQueryKey()
    }
  });

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-card border-b border-border flex items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-2xl font-bold">Liturgia</h1>
            <p className="text-sm text-muted-foreground">Monte e gerencie a ordem dos cultos</p>
          </div>
          <Button data-testid="btn-new-liturgy">
            <Plus className="w-4 h-4 mr-2" />
            Nova Liturgia
          </Button>
        </header>

        <div className="p-8 flex-1 overflow-auto bg-background">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-border bg-card/50">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : liturgies?.length ? (
              liturgies.map((liturgy) => (
                <Card 
                  key={liturgy.id} 
                  className="border-border bg-card hover:border-primary/50 transition-colors cursor-pointer group"
                  data-testid={`liturgy-card-${liturgy.id}`}
                >
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="space-y-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {liturgy.title}
                      </CardTitle>
                      {liturgy.serviceDate && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-1.5" />
                          {format(new Date(liturgy.serviceDate), "dd MMM yyyy", { locale: ptBR })}
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <ListOrdered className="w-4 h-4 mr-1.5" />
                        {liturgy.itemCount} itens
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1.5" />
                        {liturgy.totalDurationMinutes} min est.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                Nenhuma liturgia salva
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}