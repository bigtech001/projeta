const _isElectron =
  typeof window !== "undefined" && "electronAPI" in window;

type ScanResult = {
  scanned: number;
  linked: number;
  lyrics: number;
  removed: number;
};

type ElectronAPI = {
  isElectron: true;
  platform: string;

  selectFolder: () => Promise<string | null>;
  getMusicFolder: () => Promise<string>;
  openMusicFolder: () => Promise<void>;
  getUserDataPath: () => Promise<string>;

  scanMusic: (folder?: string) => Promise<ScanResult>;
  setMusicFolder: (folder: string) => Promise<{ ok: boolean; folder: string }>;

  openProjectionWindow: () => Promise<void>;
  openStageWindow: () => Promise<void>;
  setFullscreen: (flag: boolean) => Promise<void>;
  getVersion: () => Promise<string>;

  onMusicIndexed: (
    callback: (data: { songId: number; title: string; filePath: string }) => void
  ) => void;
  onScanComplete: (callback: (result: ScanResult) => void) => void;
  removeAllListeners: (channel: string) => void;
};

function getAPI(): ElectronAPI | null {
  if (!_isElectron) return null;
  return (window as unknown as { electronAPI: ElectronAPI }).electronAPI;
}

/**
 * Returns the API base URL for direct HTTP requests.
 * - In Electron the API runs on a dedicated port (8080).
 * - In the browser requests go through the shared reverse proxy at root.
 */
export function getApiBase(): string {
  if (_isElectron) return "http://localhost:8080";
  return "";
}

/** Hook that exposes Electron IPC helpers; returns null stubs in the browser. */
export function useElectron() {
  const api = getAPI();

  return {
    isElectron: _isElectron,
    platform: api?.platform ?? "web",

    selectFolder: api?.selectFolder ?? null,
    getMusicFolder: api?.getMusicFolder ?? null,
    openMusicFolder: api?.openMusicFolder ?? null,
    getUserDataPath: api?.getUserDataPath ?? null,

    scanMusic: api?.scanMusic ?? null,
    setMusicFolder: api?.setMusicFolder ?? null,

    openProjectionWindow: api?.openProjectionWindow ?? null,
    openStageWindow: api?.openStageWindow ?? null,
    setFullscreen: api?.setFullscreen ?? null,

    onMusicIndexed: api?.onMusicIndexed ?? null,
    onScanComplete: api?.onScanComplete ?? null,
    removeAllListeners: api?.removeAllListeners ?? null,
  };
}
