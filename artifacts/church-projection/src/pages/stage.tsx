import { useWebSocket } from "@/hooks/use-websocket";
import { useClock } from "@/hooks/use-clock";
import { useGetProjectionState, getGetProjectionStateQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

export default function Stage() {
  const wsState = useWebSocket();
  const { data: pollState } = useGetProjectionState({
    query: {
      queryKey: getGetProjectionStateQueryKey(),
      refetchInterval: 2000,
    }
  });
  
  const state = wsState || pollState;
  const { timeStr } = useClock();

  return (
    <div className="fixed inset-0 bg-black text-white p-6 flex flex-col cursor-none">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/20 pb-4 mb-6 shrink-0">
        <div className="text-2xl font-bold text-muted-foreground">Retorno do Altar</div>
        <div className="text-4xl font-mono font-bold text-primary tracking-wider">{timeStr}</div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full space-y-12">
        {/* Current Content */}
        <div className="space-y-4">
          <div className="text-xl uppercase tracking-widest text-primary font-bold">Atual</div>
          <div className="text-6xl font-bold leading-tight">
            {state?.currentVerseLine || state?.bibleVerse || "---"}
          </div>
        </div>

        {/* Next Content */}
        <div className="space-y-4 opacity-50">
          <div className="text-xl uppercase tracking-widest text-muted-foreground font-bold">Próximo</div>
          <div className="text-5xl font-medium leading-tight">
            {state?.nextVerseLine || "---"}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-auto shrink-0 flex justify-between items-end border-t border-white/20 pt-4">
        <div>
          <div className="text-sm uppercase tracking-widest text-muted-foreground mb-1">Música Atual</div>
          <div className="text-2xl font-bold">{state?.currentSongTitle || "---"}</div>
        </div>
        
        {state?.totalVerses && state?.currentVerseIndex !== undefined && (
          <div className="text-right">
            <div className="text-sm uppercase tracking-widest text-muted-foreground mb-1">Progresso</div>
            <div className="text-2xl font-bold font-mono">
              {state.currentVerseIndex + 1} / {state.totalVerses}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}