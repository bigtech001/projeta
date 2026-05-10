/**
 * Splits raw lyrics text into an array of verse content lines.
 * Each verse is separated by a blank line; optional label lines
 * (verso, coro, refrão, etc.) are stripped from verse content.
 */
export function parseLyrics(lyrics: string): string[][] {
  const blocks = lyrics.split(/\n\s*\n/).filter((b) => b.trim());
  return blocks.map((block) => {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const firstLine = lines[0] ?? "";
    const isLabel =
      /^(verso|estrofe|coro|refrão|bridge|pré-coro|intro|outro)\s*\d*/i.test(firstLine);
    return isLabel ? lines.slice(1) : lines;
  });
}

/**
 * Splits raw lyrics text into structured verse objects including label, index, and lines.
 * Used by the songs/:id/verses endpoint.
 */
export function parseLyricsWithLabels(lyrics: string) {
  const blocks = lyrics.split(/\n\s*\n/).filter((b) => b.trim());
  return blocks.map((block, i) => {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const firstLine = lines[0] ?? "";
    const isLabel =
      /^(verso|estrofe|coro|refrão|bridge|pré-coro|intro|outro)\s*\d*/i.test(firstLine);
    const label = isLabel ? firstLine : `Verso ${i + 1}`;
    const contentLines = isLabel ? lines.slice(1) : lines;
    return { index: i, label, lines: contentLines };
  });
}
