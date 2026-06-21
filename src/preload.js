const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("aeroChat", {
  platform: process.platform,
  installUpdate: (details) => ipcRenderer.invoke("install-update", details),
  loadConfig: () => ipcRenderer.invoke("load-config"),
  saveConfig: (config) => ipcRenderer.invoke("save-config", config),
  getConfigPath: () => ipcRenderer.invoke("get-config-path"),
  windowControl: (action) => ipcRenderer.invoke("window-control", action)
});
