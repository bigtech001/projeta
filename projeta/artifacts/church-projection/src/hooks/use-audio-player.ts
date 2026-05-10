import { useRef, useState, useCallback, useEffect } from "react";
import { getApiBase } from "./use-electron";

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  songId: number | null;
  isLoaded: boolean;
  hasError: boolean;
}

const INITIAL_STATE: AudioPlayerState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 75,
  songId: null,
  isLoaded: false,
  hasError: false,
};

/**
 * Manages a single HTMLAudioElement for MP3 playback.
 * Uses the /api/audio/stream/:id endpoint with Range request support
 * so the browser can seek freely within the file.
 */
export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioPlayerState>(INITIAL_STATE);

  const getAudio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "metadata";
    }
    return audioRef.current;
  }, []);

  /** Load a song by ID. Replaces any currently loaded audio. */
  const load = useCallback(
    (songId: number, initialVolume = 75) => {
      const audio = getAudio();

      // Reset listeners on the previous element
      audio.onloadedmetadata = null;
      audio.ontimeupdate = null;
      audio.onended = null;
      audio.onerror = null;
      audio.onplay = null;
      audio.onpause = null;

      audio.src = `${getApiBase()}/api/audio/stream/${songId}`;
      audio.volume = initialVolume / 100;
      audio.load();

      setState({
        ...INITIAL_STATE,
        songId,
        volume: initialVolume,
      });

      audio.onloadedmetadata = () => {
        setState((s) => ({ ...s, duration: audio.duration, isLoaded: true }));
      };
      audio.ontimeupdate = () => {
        setState((s) => ({ ...s, currentTime: audio.currentTime }));
      };
      audio.onended = () => {
        setState((s) => ({ ...s, isPlaying: false, currentTime: 0 }));
        audio.currentTime = 0;
      };
      audio.onerror = () => {
        setState((s) => ({ ...s, hasError: true, isPlaying: false }));
      };
      audio.onplay = () => setState((s) => ({ ...s, isPlaying: true }));
      audio.onpause = () => setState((s) => ({ ...s, isPlaying: false }));
    },
    [getAudio]
  );

  const play = useCallback(() => {
    void getAudio().play();
  }, [getAudio]);

  const pause = useCallback(() => {
    getAudio().pause();
  }, [getAudio]);

  const stop = useCallback(() => {
    const audio = getAudio();
    audio.pause();
    audio.currentTime = 0;
    setState((s) => ({ ...s, isPlaying: false, currentTime: 0 }));
  }, [getAudio]);

  const seek = useCallback(
    (seconds: number) => {
      const audio = getAudio();
      audio.currentTime = Math.max(0, Math.min(seconds, audio.duration || 0));
    },
    [getAudio]
  );

  const setVolume = useCallback(
    (volume: number) => {
      getAudio().volume = volume / 100;
      setState((s) => ({ ...s, volume }));
    },
    [getAudio]
  );

  const unload = useCallback(() => {
    const audio = getAudio();
    audio.pause();
    audio.src = "";
    setState(INITIAL_STATE);
  }, [getAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  return { state, load, play, pause, stop, seek, setVolume, unload };
}

/** Format seconds into MM:SS */
export function formatAudioTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
