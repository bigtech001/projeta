import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { useListSongs, getListSongsQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Heart, Music2, MoreHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Songs() {
  const [search, setSearch] = useState("");
  
  const { data: songs, isLoading } = useListSongs({ search }, {
    query: {
      queryKey: getListSongsQueryKey({ search })
    }
  });

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-card border-b border-border flex items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-2xl font-bold">Músicas</h1>
            <p className="text-sm text-muted-foreground">Gerencie o acervo de louvores</p>
          </div>
          <Button data-testid="btn-new-song">
            <Plus className="w-4 h-4 mr-2" />
            Nova Música
          </Button>
        </header>

        <div className="p-8 flex-1 overflow-auto">
          <Card className="border-border bg-card/50 backdrop-blur">
            <CardContent className="p-0">
              <div className="p-4 border-b border-border flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar por título, autor, trecho..." 
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    data-testid="input-search-songs"
                  />
                </div>
                <Button variant="outline">Filtros</Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Tom</TableHead>
                    <TableHead>Coletânea</TableHead>
                    <TableHead>Adicionado em</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-border">
                        <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[50px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ))
                  ) : songs?.length ? (
                    songs.map((song) => (
                      <TableRow key={song.id} className="border-border cursor-pointer hover:bg-white/5" data-testid={`song-row-${song.id}`}>
                        <TableCell>
                          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                            <Music2 className="w-5 h-5" />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {song.title}
                          {song.isFavorite && <Heart className="w-3 h-3 inline-block ml-2 text-pink-500 fill-pink-500" />}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{song.author}</TableCell>
                        <TableCell>
                          {song.key ? <Badge variant="outline" className="font-mono">{song.key}</Badge> : "-"}
                        </TableCell>
                        <TableCell>
                          {song.collectionName ? (
                            <Badge variant="secondary" className="bg-secondary/50 text-secondary-foreground">{song.collectionName}</Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(song.createdAt), "dd MMM yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        Nenhuma música encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}