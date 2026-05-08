import { contextBridge, ipcRenderer } from "electron";

/**
 * Exposed as window.electronAPI in the renderer process.
 * All values go through contextBridge — no direct Node.js access in the renderer.
 */
contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  platform: process.platform,

  /** Open the native folder-picker dialog. Returns the selected path or null if cancelled. */
  selectFolder: (): Promise<string | null> =>
    ipcRenderer.invoke("dialog:selectFolder"),

  /** Open a dedicated fullscreen projection BrowserWindow. */
  openProjectionWindow: (): Promise<void> =>
    ipcRenderer.invoke("window:openProjection"),

  /** Open the stage-monitor BrowserWindow. */
  openStageWindow: (): Promise<void> =>
    ipcRenderer.invoke("window:openStage"),

  /** Toggle fullscreen on the focused window. */
  setFullscreen: (flag: boolean): Promise<void> =>
    ipcRenderer.invoke("window:setFullscreen", flag),

  /** Get the packaged app version. */
  getVersion: (): Promise<string> =>
    ipcRenderer.invoke("app:getVersion"),

  /**
   * Register a listener for music-file indexed events.
   * Triggered by the server-side chokidar watcher when a new MP3 is linked.
   */
  onMusicIndexed: (
    callback: (data: { songId: number; title: string; filePath: string }) => void
  ): void => {
    ipcRenderer.on("music-indexed", (_event, data) => callback(data));
  },
});
