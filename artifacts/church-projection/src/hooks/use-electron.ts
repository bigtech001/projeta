// Detect if running inside Electron by checking for the contextBridge API
const _isElectron =
  typeof window !== "undefined" && "electronAPI" in window;

type ElectronAPI = {
  isElectron: true;
  platform: string;
  selectFolder: () => Promise<string | null>;
  openProjectionWindow: () => Promise<void>;
  openStageWindow: () => Promise<void>;
  setFullscreen: (flag: boolean) => Promise<void>;
  getVersion: () => Promise<string>;
  onMusicIndexed: (
    callback: (data: {
      songId: number;
      title: string;
      filePath: string;
    }) => void
  ) => void;
};

function getAPI(): ElectronAPI | null {
  if (!_isElectron) return null;
  return (window as unknown as { electronAPI: ElectronAPI }).electronAPI;
}

/**
 * Returns the API base URL for direct HTTP requests.
 * - In Electron the API runs on a separate port (8080).
 * - In the browser (Replit) requests go through the shared reverse proxy at root.
 */
export function getApiBase(): string {
  if (_isElectron) return "http://localhost:8080";
  return "";
}

/** Hook that exposes Electron IPC helpers when available, no-ops in the browser. */
export function useElectron() {
  const api = getAPI();

  return {
    isElectron: _isElectron,
    platform: api?.platform ?? "web",

    /** Open the native folder-picker dialog. Returns path or null if cancelled. */
    selectFolder: api?.selectFolder ?? null,

    /** Open a dedicated fullscreen projection BrowserWindow. */
    openProjectionWindow: api?.openProjectionWindow ?? null,

    /** Open the stage monitor BrowserWindow. */
    openStageWindow: api?.openStageWindow ?? null,

    /** Toggle fullscreen on the main window. */
    setFullscreen: api?.setFullscreen ?? null,

    /** Register a listener for music-file indexing events (Electron only). */
    onMusicIndexed: api?.onMusicIndexed ?? null,
  };
}
