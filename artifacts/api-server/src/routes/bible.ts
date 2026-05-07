import { Router, type IRouter } from "express";
import { GetBibleChapterParams, SearchBibleQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

const BIBLE_BOOKS = [
  { id: "gn", name: "Gênesis", testament: "old" as const, chapterCount: 50 },
  { id: "ex", name: "Êxodo", testament: "old" as const, chapterCount: 40 },
  { id: "lv", name: "Levítico", testament: "old" as const, chapterCount: 27 },
  { id: "nm", name: "Números", testament: "old" as const, chapterCount: 36 },
  { id: "dt", name: "Deuteronômio", testament: "old" as const, chapterCount: 34 },
  { id: "js", name: "Josué", testament: "old" as const, chapterCount: 24 },
  { id: "jz", name: "Juízes", testament: "old" as const, chapterCount: 21 },
  { id: "rt", name: "Rute", testament: "old" as const, chapterCount: 4 },
  { id: "1sm", name: "1 Samuel", testament: "old" as const, chapterCount: 31 },
  { id: "2sm", name: "2 Samuel", testament: "old" as const, chapterCount: 24 },
  { id: "1rs", name: "1 Reis", testament: "old" as const, chapterCount: 22 },
  { id: "2rs", name: "2 Reis", testament: "old" as const, chapterCount: 25 },
  { id: "1cr", name: "1 Crônicas", testament: "old" as const, chapterCount: 29 },
  { id: "2cr", name: "2 Crônicas", testament: "old" as const, chapterCount: 36 },
  { id: "ed", name: "Esdras", testament: "old" as const, chapterCount: 10 },
  { id: "ne", name: "Neemias", testament: "old" as const, chapterCount: 13 },
  { id: "et", name: "Ester", testament: "old" as const, chapterCount: 10 },
  { id: "jo", name: "Jó", testament: "old" as const, chapterCount: 42 },
  { id: "sl", name: "Salmos", testament: "old" as const, chapterCount: 150 },
  { id: "pv", name: "Provérbios", testament: "old" as const, chapterCount: 31 },
  { id: "ec", name: "Eclesiastes", testament: "old" as const, chapterCount: 12 },
  { id: "ct", name: "Cânticos", testament: "old" as const, chapterCount: 8 },
  { id: "is", name: "Isaías", testament: "old" as const, chapterCount: 66 },
  { id: "jr", name: "Jeremias", testament: "old" as const, chapterCount: 52 },
  { id: "lm", name: "Lamentações", testament: "old" as const, chapterCount: 5 },
  { id: "ez", name: "Ezequiel", testament: "old" as const, chapterCount: 48 },
  { id: "dn", name: "Daniel", testament: "old" as const, chapterCount: 12 },
  { id: "os", name: "Oséias", testament: "old" as const, chapterCount: 14 },
  { id: "jl", name: "Joel", testament: "old" as const, chapterCount: 3 },
  { id: "am", name: "Amós", testament: "old" as const, chapterCount: 9 },
  { id: "ob", name: "Obadias", testament: "old" as const, chapterCount: 1 },
  { id: "jn", name: "Jonas", testament: "old" as const, chapterCount: 4 },
  { id: "mq", name: "Miquéias", testament: "old" as const, chapterCount: 7 },
  { id: "na", name: "Naum", testament: "old" as const, chapterCount: 3 },
  { id: "hc", name: "Habacuque", testament: "old" as const, chapterCount: 3 },
  { id: "sf", name: "Sofonias", testament: "old" as const, chapterCount: 3 },
  { id: "ag", name: "Ageu", testament: "old" as const, chapterCount: 2 },
  { id: "zc", name: "Zacarias", testament: "old" as const, chapterCount: 14 },
  { id: "ml", name: "Malaquias", testament: "old" as const, chapterCount: 4 },
  { id: "mt", name: "Mateus", testament: "new" as const, chapterCount: 28 },
  { id: "mc", name: "Marcos", testament: "new" as const, chapterCount: 16 },
  { id: "lc", name: "Lucas", testament: "new" as const, chapterCount: 24 },
  { id: "jo2", name: "João", testament: "new" as const, chapterCount: 21 },
  { id: "at", name: "Atos", testament: "new" as const, chapterCount: 28 },
  { id: "rm", name: "Romanos", testament: "new" as const, chapterCount: 16 },
  { id: "1co", name: "1 Coríntios", testament: "new" as const, chapterCount: 16 },
  { id: "2co", name: "2 Coríntios", testament: "new" as const, chapterCount: 13 },
  { id: "gl", name: "Gálatas", testament: "new" as const, chapterCount: 6 },
  { id: "ef", name: "Efésios", testament: "new" as const, chapterCount: 6 },
  { id: "fp", name: "Filipenses", testament: "new" as const, chapterCount: 4 },
  { id: "cl", name: "Colossenses", testament: "new" as const, chapterCount: 4 },
  { id: "1ts", name: "1 Tessalonicenses", testament: "new" as const, chapterCount: 5 },
  { id: "2ts", name: "2 Tessalonicenses", testament: "new" as const, chapterCount: 3 },
  { id: "1tm", name: "1 Timóteo", testament: "new" as const, chapterCount: 6 },
  { id: "2tm", name: "2 Timóteo", testament: "new" as const, chapterCount: 4 },
  { id: "tt", name: "Tito", testament: "new" as const, chapterCount: 3 },
  { id: "fm", name: "Filemon", testament: "new" as const, chapterCount: 1 },
  { id: "hb", name: "Hebreus", testament: "new" as const, chapterCount: 13 },
  { id: "tg", name: "Tiago", testament: "new" as const, chapterCount: 5 },
  { id: "1pe", name: "1 Pedro", testament: "new" as const, chapterCount: 5 },
  { id: "2pe", name: "2 Pedro", testament: "new" as const, chapterCount: 3 },
  { id: "1jo", name: "1 João", testament: "new" as const, chapterCount: 5 },
  { id: "2jo", name: "2 João", testament: "new" as const, chapterCount: 1 },
  { id: "3jo", name: "3 João", testament: "new" as const, chapterCount: 1 },
  { id: "jd", name: "Judas", testament: "new" as const, chapterCount: 1 },
  { id: "ap", name: "Apocalipse", testament: "new" as const, chapterCount: 22 },
];

const SAMPLE_VERSES: Record<string, Record<number, string[]>> = {
  jo2: {
    1: [
      "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
      "Porque Deus enviou o seu Filho ao mundo, não para que condenasse o mundo, mas para que o mundo fosse salvo por ele.",
      "Quem crê nele não é condenado; mas quem não crê já está condenado, porquanto não crê no nome do unigênito Filho de Deus.",
    ],
  },
  sl: {
    23: [
      "O Senhor é o meu pastor; nada me faltará.",
      "Deitar-me faz em verdes pastos; guia-me mansamente a águas tranquilas.",
      "Refrigera a minha alma; guia-me pelas veredas da justiça por amor do seu nome.",
      "Ainda que eu andasse pelo vale da sombra da morte, não temeria mal algum, porque tu estás comigo; o teu bordão e o teu cajado me consolam.",
      "Preparas uma mesa perante mim na presença dos meus inimigos; unges a minha cabeça com óleo; o meu cálice transborda.",
      "Certamente que a bondade e a misericórdia me seguirão todos os dias da minha vida; e habitarei na casa do Senhor por longos dias.",
    ],
    91: [
      "O que habita no esconderijo do Altíssimo, e descansa à sombra do Onipotente,",
      "Diz ao Senhor: Ele é o meu Deus, o meu refúgio, a minha fortaleza, e nele confiarei.",
      "Porque ele te livrará do laço do passarinheiro, e da peste perniciosa.",
      "Com as suas penas te cobrirá, e debaixo das suas asas te abrigarás; a sua verdade será o teu escudo e broquel.",
    ],
  },
  fp: {
    4: [
      "Regozijai-vos sempre no Senhor; outra vez digo, regozijai-vos.",
      "A vossa modéstia seja conhecida de todos os homens. O Senhor está próximo.",
      "Não estejais inquietos por coisa alguma; antes as vossas petições sejam em tudo conhecidas diante de Deus pela oração e súplica, com ação de graças.",
      "E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos pensamentos em Cristo Jesus.",
      "Posso tudo em Cristo que me fortalece.",
    ],
  },
  is: {
    40: [
      "Não o sabes tu? Não o ouviste? O Deus eterno, o Senhor, o Criador dos fins da terra, nem se cansa, nem se fatiga; não há pesquisa do seu entendimento.",
      "Dá força ao cansado, e multiplica as forças ao que não tem nenhum vigor.",
      "Os mancebos se cansam e se fatigam, e os jovens totalmente caem;",
      "Mas os que esperam no Senhor renovarão as suas forças e subirão com asas como águias; correrão, e não se cansarão; caminharão, e não se fatigarão.",
    ],
  },
};

function getVerses(book: string, chapter: number) {
  const bookData = BIBLE_BOOKS.find((b) => b.id === book);
  if (!bookData) return null;

  const verses = SAMPLE_VERSES[book]?.[chapter];
  if (verses) {
    return verses.map((text, i) => ({
      book,
      bookName: bookData.name,
      chapter,
      verse: i + 1,
      text,
      reference: `${bookData.name} ${chapter}:${i + 1}`,
    }));
  }

  const generated = Array.from({ length: 10 }, (_, i) => ({
    book,
    bookName: bookData.name,
    chapter,
    verse: i + 1,
    text: `Versículo ${i + 1} do capítulo ${chapter} de ${bookData.name}.`,
    reference: `${bookData.name} ${chapter}:${i + 1}`,
  }));
  return generated;
}

router.get("/bible/books", async (_req, res): Promise<void> => {
  res.json(BIBLE_BOOKS);
});

router.get("/bible/search", async (req, res): Promise<void> => {
  const query = SearchBibleQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { q } = query.data;
  const searchLower = q.toLowerCase();

  const results: object[] = [];
  for (const book of BIBLE_BOOKS) {
    const bookVerses = SAMPLE_VERSES[book.id];
    if (!bookVerses) continue;
    for (const [chapter, verses] of Object.entries(bookVerses)) {
      for (let i = 0; i < verses.length; i++) {
        if (verses[i].toLowerCase().includes(searchLower)) {
          results.push({
            book: book.id,
            bookName: book.name,
            chapter: parseInt(chapter),
            verse: i + 1,
            text: verses[i],
            reference: `${book.name} ${chapter}:${i + 1}`,
          });
        }
      }
    }
    if (results.length >= 20) break;
  }

  res.json(results);
});

router.get("/bible/:book/:chapter", async (req, res): Promise<void> => {
  const rawBook = Array.isArray(req.params.book) ? req.params.book[0] : req.params.book;
  const rawChapter = Array.isArray(req.params.chapter) ? req.params.chapter[0] : req.params.chapter;
  const params = GetBibleChapterParams.safeParse({ book: rawBook, chapter: rawChapter });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const verses = getVerses(params.data.book, params.data.chapter);
  if (!verses) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  res.json(verses);
});

export default router;
