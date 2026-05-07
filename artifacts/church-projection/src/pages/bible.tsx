import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { 
  useListBibleBooks, 
  getListBibleBooksQueryKey,
  useGetBibleChapter,
  getGetBibleChapterQueryKey,
  useControlProjection
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Book, ChevronRight, MonitorPlay } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Bible() {
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);

  const { data: books, isLoading: isLoadingBooks } = useListBibleBooks({
    query: {
      queryKey: getListBibleBooksQueryKey()
    }
  });

  const { data: chapterVerses, isLoading: isLoadingVerses } = useGetBibleChapter(
    selectedBook || "", 
    selectedChapter,
    {
      query: {
        enabled: !!selectedBook,
        queryKey: getGetBibleChapterQueryKey(selectedBook || "", selectedChapter)
      }
    }
  );

  const controlProjection = useControlProjection();

  const handleShowVerse = (reference: string, text: string) => {
    controlProjection.mutate({
      data: {
        action: "show_bible",
        bibleReference: reference,
        bibleVerse: text
      }
    });
  };

  const oldTestament = books?.filter(b => b.testament === "old") || [];
  const newTestament = books?.filter(b => b.testament === "new") || [];

  return (
    <MainLayout>
      <div className="flex-1 flex overflow-hidden">
        
        {/* Books List */}
        <div className="w-64 border-r border-border bg-card/50 flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar livro..." 
                className="pl-9 bg-background border-border"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2">
              {isLoadingBooks ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full mb-1" />
                ))
              ) : (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Antigo Testamento</div>
                  {oldTestament.filter(b => b.name.toLowerCase().includes(search.toLowerCase())).map(book => (
                    <Button
                      key={book.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-10 px-3 font-normal",
                        selectedBook === book.id && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                      )}
                      onClick={() => {
                        setSelectedBook(book.id);
                        setSelectedChapter(1);
                      }}
                    >
                      {book.name}
                    </Button>
                  ))}

                  <div className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Novo Testamento</div>
                  {newTestament.filter(b => b.name.toLowerCase().includes(search.toLowerCase())).map(book => (
                    <Button
                      key={book.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-10 px-3 font-normal",
                        selectedBook === book.id && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                      )}
                      onClick={() => {
                        setSelectedBook(book.id);
                        setSelectedChapter(1);
                      }}
                    >
                      {book.name}
                    </Button>
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chapter Grid & Verses */}
        <div className="flex-1 flex flex-col bg-background">
          {selectedBook ? (
            <>
              {/* Chapters */}
              <div className="p-4 border-b border-border bg-card shrink-0">
                <div className="flex items-center space-x-2 mb-4">
                  <h2 className="text-xl font-bold">
                    {books?.find(b => b.id === selectedBook)?.name}
                  </h2>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Capítulo {selectedChapter}</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: books?.find(b => b.id === selectedBook)?.chapterCount || 0 }).map((_, i) => (
                    <button
                      key={i}
                      className={cn(
                        "w-10 h-10 rounded-md font-medium text-sm flex items-center justify-center transition-colors",
                        selectedChapter === i + 1 
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                          : "bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => setSelectedChapter(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Verses */}
              <ScrollArea className="flex-1 p-6">
                <div className="max-w-3xl mx-auto space-y-4 pb-20">
                  {isLoadingVerses ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <Card key={i} className="p-4 bg-card/50 border-border"><Skeleton className="h-10 w-full" /></Card>
                    ))
                  ) : chapterVerses?.map((verse) => (
                    <Card 
                      key={verse.verse} 
                      className="border-border hover:border-primary/50 bg-card hover:bg-white/5 transition-all group overflow-hidden"
                    >
                      <div className="flex">
                        <div className="w-12 bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground border-r border-border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                          {verse.verse}
                        </div>
                        <div className="p-4 flex-1 text-lg flex justify-between items-center">
                          <span className="pr-4">{verse.text}</span>
                          <Button 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={() => handleShowVerse(verse.reference, verse.text)}
                            data-testid={`btn-project-verse-${verse.verse}`}
                          >
                            <MonitorPlay className="w-4 h-4 mr-2" />
                            Projetar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Book className="w-16 h-16 mb-4 opacity-20" />
              <p>Selecione um livro para começar</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}