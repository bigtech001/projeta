import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWebSocket } from "@/hooks/use-websocket";
import { useGetProjectionState, getGetProjectionStateQueryKey } from "@workspace/api-client-react";

export default function Projection() {
  const wsState = useWebSocket();
  const { data: pollState } = useGetProjectionState({
    query: {
      queryKey: getGetProjectionStateQueryKey(),
      refetchInterval: 2000,
    }
  });

  const state = wsState || pollState;

  if (!state || state.mode === "blank" || !state.isActive) {
    return <div className="fixed inset-0 bg-black cursor-none" />;
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col justify-end p-12 cursor-none">
      {/* Optional Background/Theme Graphics could go here */}
      
      <AnimatePresence mode="wait">
        {state.mode === "song" && state.currentVerseLine && (
          <motion.div
            key={`${state.currentSongId}-${state.currentVerseIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[90%] mx-auto text-center"
          >
            <div className="text-[5vw] font-bold leading-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)] whitespace-pre-wrap">
              {state.currentVerseLine}
            </div>
          </motion.div>
        )}

        {state.mode === "bible" && state.bibleVerse && (
          <motion.div
            key={state.bibleReference}
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
      </AnimatePresence>

      {/* Footer Info (Song Title) */}
      <AnimatePresence>
        {state.mode === "song" && state.currentSongTitle && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-6 left-8 text-white/50 text-xl font-medium tracking-wide"
          >
            {state.currentSongTitle}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}