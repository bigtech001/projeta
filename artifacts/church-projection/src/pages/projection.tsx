import { useEffect } from "react";
import { motion, AnimatePresence, type HTMLMotionProps } from "framer-motion";
import { useWebSocket } from "@/hooks/use-websocket";
import { useGetProjectionState, getGetProjectionStateQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

function getProjectionBg(bg?: string): string {
  switch (bg) {
    case "dark-blue": return "bg-[hsl(221_44%_7%)]";
    case "gradient": return "bg-gradient-to-b from-[hsl(221_44%_5%)] via-[hsl(225_50%_8%)] to-black";
    default: return "bg-black";
  }
}

function getFontSizeClass(size?: string): string {
  switch (size) {
    case "small": return "text-[3.5vw]";
    case "medium": return "text-[4.5vw]";
    case "xl": return "text-[6.5vw]";
    default: return "text-[5vw]";
  }
}

type MotionDivProps = HTMLMotionProps<"div">;

function getTransitionProps(transition?: string): Pick<MotionDivProps, "initial" | "animate" | "exit" | "transition"> {
  switch (transition) {
    case "slide":
      return {
        initial: { opacity: 0, y: 40 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -40 },
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
      };
    case "scale":
      return {
        initial: { opacity: 0, scale: 0.92 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.08 },
        transition: { duration: 0.4, ease: "easeOut" as const },
      };
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.5 },
      };
  }
}

export default function Projection() {
  const wsState = useWebSocket();
  const { data: pollState } = useGetProjectionState({
    query: {
      queryKey: getGetProjectionStateQueryKey(),
      refetchInterval: 2000,
    },
  });

  const state = wsState ?? pollState;

  const projectionBg = localStorage.getItem("cl-projection-bg") ?? "black";
  const fontSize = localStorage.getItem("cl-projection-fs") ?? "large";
  const transitionStyle = localStorage.getItem("cl-projection-transition") ?? "fade";
  const transitionProps = getTransitionProps(transitionStyle);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "F11" || (e.key === "f" && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      }
    };
    document.addEventListener("keydown", handleKey);

    if (window.opener) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const songKey = `${state?.currentSongId ?? ""}-${state?.currentVerseIndex ?? ""}`;

  if (!state || state.mode === "blank" || !state.isActive) {
    return (
      <div className={cn("fixed inset-0 cursor-none flex items-center justify-center", getProjectionBg(projectionBg))}>
        <div className="text-white/10 text-2xl font-light select-none">ChurchLive</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-0 overflow-hidden flex flex-col justify-end p-12 cursor-none select-none",
        getProjectionBg(projectionBg)
      )}
    >
      <AnimatePresence mode="wait">
        {state.mode === "song" && state.currentVerseLine && (
          <motion.div
            key={songKey}
            {...transitionProps}
            className="w-full max-w-[90%] mx-auto text-center"
          >
            <div
              className={cn(
                "font-bold leading-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] whitespace-pre-wrap",
                getFontSizeClass(fontSize)
              )}
            >
              {state.currentVerseLine}
            </div>
          </motion.div>
        )}

        {state.mode === "bible" && state.bibleVerse && (
          <motion.div
            key={state.bibleReference ?? "bible"}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-[85%] mx-auto text-center bg-black/40 p-12 rounded-3xl backdrop-blur-sm border border-white/10"
          >
            <div className="text-[4vw] font-medium leading-normal text-white drop-shadow-2xl mb-8">
              "{state.bibleVerse}"
            </div>
            <div className="text-[2vw] font-bold text-primary tracking-wider uppercase">
              {state.bibleReference}
            </div>
          </motion.div>
        )}

        {state.mode === "announcement" && state.announcement && (
          <motion.div
            key="announcement"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[85%] mx-auto text-center"
          >
            <div className="text-[4.5vw] font-semibold text-white leading-tight whitespace-pre-wrap drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
              {state.announcement}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.mode === "song" && state.currentSongTitle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-6 left-8 text-white/40 text-xl font-medium tracking-wide"
          >
            {state.currentSongTitle}
            {state.totalVerses != null && state.currentVerseIndex != null && (
              <span className="ml-4 text-white/25 font-mono text-lg">
                {state.currentVerseIndex + 1}/{state.totalVerses}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-6 text-white/10 text-sm font-mono select-none">
        F — fullscreen
      </div>
    </div>
  );
}
