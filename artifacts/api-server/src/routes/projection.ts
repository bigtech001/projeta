import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, projectionStateTable, songsTable } from "@workspace/db";
import { ControlProjectionBody } from "@workspace/api-zod";
import { broadcastProjectionUpdate } from "../lib/websocket";
import { parseLyrics } from "../lib/parse-lyrics";

const router: IRouter = Router();

async function getOrCreateState() {
  const rows = await db.select().from(projectionStateTable).limit(1);
  if (rows[0]) return rows[0];
  const [state] = await db.insert(projectionStateTable).values({}).returning();
  return state;
}

router.get("/projection/state", async (_req, res): Promise<void> => {
  const state = await getOrCreateState();
  res.json(state);
});

router.post("/projection/control", async (req, res): Promise<void> => {
  const parsed = ControlProjectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const state = await getOrCreateState();
  const { action } = parsed.data;
  let updateData: Partial<typeof state> = {};

  if (action === "show_song" && parsed.data.songId != null) {
    const [song] = await db.select().from(songsTable).where(eq(songsTable.id, parsed.data.songId));
    if (!song) {
      res.status(404).json({ error: "Song not found" });
      return;
    }

    const verses = parseLyrics(song.lyrics);
    const verseIdx = parsed.data.verseIndex ?? 0;
    const currentLines = verses[verseIdx] ?? [];
    const nextLines = verses[verseIdx + 1] ?? [];

    updateData = {
      isActive: true,
      mode: "song",
      currentSongId: song.id,
      currentSongTitle: song.title,
      currentVerseIndex: verseIdx,
      currentVerseLine: currentLines.join("\n"),
      nextVerseLine: nextLines.join("\n") || null,
      totalVerses: verses.length,
      bibleVerse: null,
      bibleReference: null,
      announcement: null,
    };
  } else if (action === "next_verse") {
    if (state.currentSongId != null) {
      const [song] = await db.select().from(songsTable).where(eq(songsTable.id, state.currentSongId));
      if (song) {
        const verses = parseLyrics(song.lyrics);
        const nextIdx = Math.min((state.currentVerseIndex ?? 0) + 1, verses.length - 1);
        const currentLines = verses[nextIdx] ?? [];
        const nextLines = verses[nextIdx + 1] ?? [];
        updateData = {
          currentVerseIndex: nextIdx,
          currentVerseLine: currentLines.join("\n"),
          nextVerseLine: nextLines.join("\n") || null,
        };
      }
    }
  } else if (action === "prev_verse") {
    if (state.currentSongId != null) {
      const [song] = await db.select().from(songsTable).where(eq(songsTable.id, state.currentSongId));
      if (song) {
        const verses = parseLyrics(song.lyrics);
        const prevIdx = Math.max((state.currentVerseIndex ?? 0) - 1, 0);
        const currentLines = verses[prevIdx] ?? [];
        const nextLines = verses[prevIdx + 1] ?? [];
        updateData = {
          currentVerseIndex: prevIdx,
          currentVerseLine: currentLines.join("\n"),
          nextVerseLine: nextLines.join("\n") || null,
        };
      }
    }
  } else if (action === "blank") {
    updateData = { isActive: false, mode: "blank" };
  } else if (action === "show_bible") {
    updateData = {
      isActive: true,
      mode: "bible",
      bibleVerse: parsed.data.bibleVerse ?? null,
      bibleReference: parsed.data.bibleReference ?? null,
      currentSongId: null,
      currentSongTitle: null,
      announcement: null,
    };
  } else if (action === "show_announcement") {
    updateData = {
      isActive: true,
      mode: "announcement",
      announcement: parsed.data.announcement ?? null,
      currentSongId: null,
      bibleVerse: null,
    };
  } else if (action === "play_audio") {
    updateData = { isAudioPlaying: true };
  } else if (action === "pause_audio") {
    updateData = { isAudioPlaying: false };
  } else if (action === "stop_audio") {
    updateData = { isAudioPlaying: false };
  } else if (action === "set_volume" && parsed.data.volume != null) {
    updateData = { audioVolume: parsed.data.volume };
  } else if (action === "set_liturgy" && parsed.data.liturgyId != null) {
    updateData = { currentLiturgyId: parsed.data.liturgyId };
  }

  if (Object.keys(updateData).length > 0) {
    const [updated] = await db
      .update(projectionStateTable)
      .set({ ...updateData, updatedAt: new Date().toISOString() })
      .where(eq(projectionStateTable.id, state.id))
      .returning();

    broadcastProjectionUpdate(updated);
    res.json(updated);
  } else {
    res.json(state);
  }
});

export default router;
