import { MainLayout } from "@/components/layout/main-layout";
import { useListCollections, getListCollectionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Library } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function Collections() {
  const [search, setSearch] = useState("");
  
  const { data: collections, isLoading } = useListCollections({ search }, {
    query: {
      queryKey: getListCollectionsQueryKey({ search })
    }
  });

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-card border-b border-border flex items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-2xl font-bold">Coletâneas</h1>
            <p className="text-sm text-muted-foreground">Álbuns e pastas de músicas</p>
          </div>
          <Button data-testid="btn-new-collection">
            <Plus className="w-4 h-4 mr-2" />
            Nova Coletânea
          </Button>
        </header>

        <div className="p-8 flex-1 overflow-auto">
          <div className="mb-6 max-w-md relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar coletânea..." 
              className="pl-9 bg-card border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <Card key={i} className="border-border bg-card/50">
                  <CardContent className="p-0">
                    <Skeleton className="h-48 w-full rounded-t-xl rounded-b-none" />
                    <div className="p-4">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : collections?.length ? (
              collections.map((collection) => (
                <Card 
                  key={collection.id} 
                  className="border-border bg-card hover:bg-white/5 transition-all cursor-pointer group overflow-hidden"
                  data-testid={`collection-card-${collection.id}`}
                >
                  <CardContent className="p-0">
                    <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                      <Library className="w-16 h-16 text-primary/40 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="p-4 border-t border-border">
                      <h3 className="font-bold text-lg truncate">{collection.name}</h3>
                      <p className="text-sm text-muted-foreground">{collection.songCount} músicas</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                Nenhuma coletânea encontrada
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}