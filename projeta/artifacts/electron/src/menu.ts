import { Menu, app, BrowserWindow, shell } from "electron";

export function createMenu(): Menu {
  const isMac = process.platform === "darwin";

  const template: Electron.MenuItemConstructorOptions[] = [
    // macOS app menu
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),

    {
      label: "Arquivo",
      submenu: [
        {
          label: "Configurações",
          accelerator: "CmdOrCtrl+,",
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.executeJavaScript(
              `window.history.pushState(null, '', '/settings'); window.dispatchEvent(new PopStateEvent('popstate'))`
            );
          },
        },
        { type: "separator" },
        isMac ? { role: "close" as const } : { role: "quit" as const },
      ],
    },

    {
      label: "Visualizar",
      submenu: [
        {
          label: "Abrir Projeção",
          accelerator: "CmdOrCtrl+P",
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(
              "menu:openProjection"
            );
          },
        },
        {
          label: "Abrir Monitor de Palco",
          accelerator: "CmdOrCtrl+Shift+S",
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.send(
              "menu:openStage"
            );
          },
        },
        { type: "separator" },
        { role: "togglefullscreen" },
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
      ],
    },

    {
      label: "Janela",
      submenu: [
        { role: "minimize" },
        ...(isMac
          ? [
              { type: "separator" as const },
              { role: "front" as const },
            ]
          : [{ role: "close" as const }]),
      ],
    },

    {
      label: "Ajuda",
      submenu: [
        {
          label: "Documentação",
          click: async () => {
            await shell.openExternal("https://github.com/churchlive");
          },
        },
        {
          label: "Reportar Problema",
          click: async () => {
            await shell.openExternal(
              "https://github.com/churchlive/issues/new"
            );
          },
        },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}
