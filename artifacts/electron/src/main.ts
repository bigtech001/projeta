import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  shell,
} from "electron";
import { spawn, ChildProcess } from "child_process";
import http from "http";
import path from "path";
import { createMenu } from "./menu";

// ── Constants ─────────────────────────────────────────────────────────────────

const isDev = !app.isPackaged || process.env.NODE_ENV === "development";
const API_PORT = 8080;
// In dev, the Vite dev server runs separately; in production, Express serves everything
const DEV_FRONTEND = `http://localhost:20976`;
const PROD_FRONTEND = `http://localhost:${API_PORT}`;
const APP_URL = isDev ? DEV_FRONTEND : PROD_FRONTEND;

// ── Window registry ───────────────────────────────────────────────────────────

let mainWindow: BrowserWindow | null = null;
let projectionWindow: BrowserWindow | null = null;
let stageWindow: BrowserWindow | null = null;
let apiServerProcess: ChildProcess | null = null;

// ── API server lifecycle ──────────────────────────────────────────────────────

function startApiServer(): void {
  const dbPath = path.join(app.getPath("userData"), "churchlive.db");

  const serverPath = isDev
    ? path.resolve(__dirname, "../../api-server/dist/index.mjs")
    : path.join(process.resourcesPath, "api-server", "dist", "index.mjs");

  const musicFolder = path.join(app.getPath("userData"), "musicas");

  apiServerProcess = spawn("node", ["--enable-source-maps", serverPath], {
    env: {
      ...process.env,
      PORT: String(API_PORT),
      DB_PATH: dbPath,
      MUSIC_FOLDER: musicFolder,
      NODE_ENV: isDev ? "development" : "production",
    },
    stdio: "inherit",
  });

  apiServerProcess.on("error", (err) => {
    console.error("[ChurchLive] API server spawn error:", err);
  });

  apiServerProcess.on("exit", (code, signal) => {
    if (code !== 0 && signal !== "SIGTERM") {
      console.error(`[ChurchLive] API server exited unexpectedly: code=${code}`);
    }
  });
}

/** Poll /api/healthz until the server is ready (max ~15 s). */
function waitForServer(port: number, attempts = 30): Promise<void> {
  return new Promise((resolve, reject) => {
    const check = (remaining: number) => {
      const req = http.request(
        { hostname: "localhost", port, path: "/api/healthz", timeout: 1000 },
        (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else if (remaining > 0) {
            setTimeout(() => check(remaining - 1), 500);
          } else {
            reject(new Error("API server not ready after max retries"));
          }
        }
      );
      req.on("error", () => {
        if (remaining > 0) setTimeout(() => check(remaining - 1), 500);
        else reject(new Error("API server did not start"));
      });
      req.end();
    };
    check(attempts);
  });
}

// ── Window factories ──────────────────────────────────────────────────────────

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    title: "ChurchLive",
    backgroundColor: "#0a0f1e",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Intercept window.open() calls from the renderer to create proper BrowserWindows
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    handleWindowOpen(url);
    return { action: "deny" };
  });

  mainWindow.loadURL(`${APP_URL}/operator`);
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("closed", () => { mainWindow = null; });
}

function createProjectionWindow(): void {
  if (projectionWindow) { projectionWindow.focus(); return; }

  projectionWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    title: "ChurchLive — Projeção",
    fullscreen: true,
    frame: false,
    backgroundColor: "#000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  projectionWindow.loadURL(`${APP_URL}/projection`);
  projectionWindow.on("closed", () => { projectionWindow = null; });
}

function createStageWindow(): void {
  if (stageWindow) { stageWindow.focus(); return; }

  stageWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    title: "ChurchLive — Monitor de Palco",
    backgroundColor: "#0a0f1e",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  stageWindow.loadURL(`${APP_URL}/stage`);
  stageWindow.on("closed", () => { stageWindow = null; });
}

function handleWindowOpen(url: string): void {
  if (url.includes("/projection")) {
    createProjectionWindow();
  } else if (url.includes("/stage")) {
    createStageWindow();
  } else {
    void shell.openExternal(url);
  }
}

// ── IPC handlers ──────────────────────────────────────────────────────────────

function setupIPC(): void {
  ipcMain.handle("dialog:selectFolder", async () => {
    const win = mainWindow ?? BrowserWindow.getFocusedWindow();
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
      title: "Selecionar Pasta de Músicas",
      buttonLabel: "Selecionar Pasta",
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle("window:openProjection", () => {
    createProjectionWindow();
  });

  ipcMain.handle("window:openStage", () => {
    createStageWindow();
  });

  ipcMain.handle("window:setFullscreen", (_event, flag: boolean) => {
    (BrowserWindow.getFocusedWindow() ?? mainWindow)?.setFullScreen(flag);
  });

  ipcMain.handle("app:getVersion", () => app.getVersion());
}

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  // In production, we manage the API server process ourselves
  if (!isDev) {
    startApiServer();
    try {
      await waitForServer(API_PORT);
    } catch {
      console.error("[ChurchLive] Warning: could not confirm API server readiness");
    }
  }

  setupIPC();
  Menu.setApplicationMenu(createMenu());
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    apiServerProcess?.kill("SIGTERM");
    app.quit();
  }
});

app.on("before-quit", () => {
  apiServerProcess?.kill("SIGTERM");
});
