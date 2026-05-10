import { useState, useEffect, useRef } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useClock } from "@/hooks/use-clock";
import {
  useGetProjectionState,
  getGetProjectionStateQueryKey,
  useGetLiturgy,
  getGetLiturgyQueryKey,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Play, Pause, RotateCcw, Bell } from "lucide-react";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Stage() {
  const wsState = useWebSocket();
  const { data: pollState } = useGetProjectionState({
    query: {
      queryKey: getGetProjectionStateQueryKey(),
      refetchInterval: 2000,
    },
  });

  const state = wsState ?? pollState;
  const { timeStr } = useClock();

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  const liturgyId = state?.currentLiturgyId ?? null;
  const { data: liturgy } = useGetLiturgy(liturgyId!, {
    query: {
      enabled: !!liturgyId,
      queryKey: getGetLiturgyQueryKey(liturgyId!),
      refetchInterval: 10000,
    },
  });

  const currentItem = liturgy?.items?.find(
    (item) =>
      state?.mode === "song" &&
      item.songId === state?.currentSongId
  );
  const currentItemIndex = currentItem
    ? liturgy!.items!.indexOf(currentItem)
    : -1;
  const nextItem =
    currentItemIndex >= 0 ? liturgy?.items?.[currentItemIndex + 1] : liturgy?.items?.[0];

  const announcement = state?.mode === "announcement" ? state.announcement : null;

  return (
    <div className="fixed inset-0 bg-[hsl(221_44%_5%)] text-white flex flex-col cursor-none overflow-hidden">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-8 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-white/50 text-sm font-medium tracking-widest uppercase">
            Monitor de Palco
          </span>
        </div>
        <div className="text-5xl font-mono font-bold text-primary tracking-wider">
          {timeStr}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col justify-center px-12 py-8 min-h-0">

          {/* Announcement Banner */}
          {announcement && (
            <div className="mb-6 bg-amber-500/20 border border-amber-500/40 rounded-xl px-6 py-4 flex items-center gap-4">
              <Bell className="w-6 h-6 text-amber-400 shrink-0" />
              <p className="text-amber-200 text-xl font-medium">{announcement}</p>
            </div>
          )}

          {/* Current Content */}
          <div className="mb-10">
            <div className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4 flex items-center gap-2">
              <div className="w-4 h-px bg-primary" />
              Projetando Agora
            </div>
            <div
              className={cn(
                "font-bold leading-tight",
                (state?.currentVerseLine?.length ?? 0) > 120
                  ? "text-4xl"
                  : "text-5xl"
              )}
            >
              {state?.currentVerseLine || state?.bibleVerse || (
                <span className="text-white/20 font-normal">Tela em branco</span>
              )}
            </div>
            {state?.mode === "song" && state.currentSongTitle && (
              <div className="mt-3 text-white/40 text-lg">
                {state.currentSongTitle}
                {state.totalVerses != null && state.currentVerseIndex != null && (
                  <span className="ml-3 font-mono text-white/25">
                    ({state.currentVerseIndex + 1}/{state.totalVerses})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Next Verse */}
          <div className="opacity-50">
            <div className="text-xs uppercase tracking-[0.3em] text-white/40 font-bold mb-3 flex items-center gap-2">
              <div className="w-4 h-px bg-white/30" />
              Próxima Estrofe
            </div>
            <div className="text-3xl font-medium leading-normal text-white/60 whitespace-pre-wrap">
              {state?.nextVerseLine || (
                <span className="text-white/20 italic text-xl">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="shrink-0 border-t border-white/10 px-8 py-4 grid grid-cols-3 gap-6">

          {/* Worship Timer */}
          <div className="flex flex-col gap-2">
            <div className="text-xs uppercase tracking-widest text-white/40 font-bold">
              Cronômetro do Culto
            </div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-mono font-bold text-white">
                {formatDuration(timerSeconds)}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setTimerRunning((r) => !r)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  {timerRunning ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5 ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerSeconds(0);
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Current Song / Bible */}
          <div className="flex flex-col gap-1">
            <div className="text-xs uppercase tracking-widest text-white/40 font-bold">
              {state?.mode === "bible" ? "Referência" : "Música Atual"}
            </div>
            <div className="text-xl font-semibold truncate">
              {state?.mode === "bible"
                ? (state.bibleReference ?? "—")
                : (state?.currentSongTitle ?? "—")}
            </div>
          </div>

          {/* Next Liturgy Item */}
          <div className="flex flex-col gap-1">
            <div className="text-xs uppercase tracking-widest text-white/40 font-bold">
              Próximo na Liturgia
            </div>
            {nextItem ? (
              <div>
                <div className="text-lg font-semibold truncate">{nextItem.title}</div>
                <div className="text-sm text-white/40 capitalize">{nextItem.type} · {nextItem.durationMinutes}min</div>
              </div>
            ) : (
              <div className="text-white/20 text-lg">—</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
