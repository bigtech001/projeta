import { contextBridge, ipcRenderer } from "electron";

/**
 * Exposed as window.electronAPI in the renderer process.
 * All values go through contextBridge — no direct Node.js access in the renderer.
 */
contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  platform: process.platform,

  // ── Folder operations ────────────────────────────────────────────────────

  /** Open the native folder-picker dialog. Returns the selected path or null. */
  selectFolder: (): Promise<string | null> =>
    ipcRenderer.invoke("dialog:selectFolder"),

  /** Returns the current music folder path (userData/musicas in production). */
  getMusicFolder: (): Promise<string> =>
    ipcRenderer.invoke("music:getFolder"),

  /** Opens the music folder in the OS file explorer (Windows Explorer / Finder). */
  openMusicFolder: (): Promise<void> =>
    ipcRenderer.invoke("music:openFolder"),

  /** Returns the Electron userData directory path. */
  getUserDataPath: (): Promise<string> =>
    ipcRenderer.invoke("app:getUserDataPath"),

  // ── Music indexing ───────────────────────────────────────────────────────

  /**
   * Trigger a full recursive scan of the music folder.
   * Returns { scanned, linked, lyrics, removed }.
   * Optionally pass a custom folder path to scan.
   */
  scanMusic: (folder?: string): Promise<{
    scanned: number;
    linked: number;
    lyrics: number;
    removed: number;
  }> => ipcRenderer.invoke("music:scan", folder),

  /**
   * Update the API server's active watch folder.
   * Creates the folder if it doesn't exist.
   */
  setMusicFolder: (folder: string): Promise<{ ok: boolean; folder: string }> =>
    ipcRenderer.invoke("music:setFolder", folder),

  // ── Window management ────────────────────────────────────────────────────

  /** Open a dedicated fullscreen projection BrowserWindow. */
  openProjectionWindow: (): Promise<void> =>
    ipcRenderer.invoke("window:openProjection"),

  /** Open the stage-monitor BrowserWindow. */
  openStageWindow: (): Promise<void> =>
    ipcRenderer.invoke("window:openStage"),

  /** Toggle fullscreen on the focused window. */
  setFullscreen: (flag: boolean): Promise<void> =>
    ipcRenderer.invoke("window:setFullscreen", flag),

  // ── App info ─────────────────────────────────────────────────────────────

  /** Get the packaged app version. */
  getVersion: (): Promise<string> =>
    ipcRenderer.invoke("app:getVersion"),

  // ── Events ───────────────────────────────────────────────────────────────

  /**
   * Register a listener for music-file indexed events.
   * Triggered by the server-side watcher when a new MP3 is linked.
   */
  onMusicIndexed: (
    callback: (data: { songId: number; title: string; filePath: string }) => void
  ): void => {
    ipcRenderer.on("music-indexed", (_event, data) => callback(data));
  },

  /**
   * Register a listener for scan-complete events.
   * Triggered by the main process after music:scan finishes.
   */
  onScanComplete: (
    callback: (result: { scanned: number; linked: number; lyrics: number; removed: number }) => void
  ): void => {
    ipcRenderer.on("music-scan-complete", (_event, result) => callback(result));
  },

  /** Remove all listeners for the given channel. */
  removeAllListeners: (channel: string): void => {
    ipcRenderer.removeAllListeners(channel);
  },
});
