const { app, BrowserWindow, shell } = require("electron");
const { join } = require("node:path");

const windowIcon = process.platform === "win32"
  ? join(__dirname, "../../assets/app.ico")
  : join(__dirname, "../../assets/linux-icons/512x512.png");

function createWindow() {
  const win = new BrowserWindow({
    width: 760,
    height: 560,
    minWidth: 620,
    minHeight: 440,
    title: "Aero P2P Chat",
    icon: windowIcon,
    backgroundColor: "#c5f2ff",
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
