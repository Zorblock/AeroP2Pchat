const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("aeroChat", {
  platform: process.platform,
  installUpdate: (details) => ipcRenderer.invoke("install-update", details),
  onUpdateProgress: (callback) => {
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on("update-progress", listener);
    return () => {
      ipcRenderer.removeListener("update-progress", listener);
    };
  },
  loadConfig: () => ipcRenderer.invoke("load-config"),
  saveConfig: (config) => ipcRenderer.invoke("save-config", config),
  getConfigPath: () => ipcRenderer.invoke("get-config-path"),
  getScreenSources: () => ipcRenderer.invoke("get-screen-sources"),
  writeClipboard: (text) => ipcRenderer.invoke("write-clipboard", text),
  showNotification: (details) => ipcRenderer.invoke("show-app-notification", details),
  closeNotification: (id) => ipcRenderer.invoke("close-app-notification", id),
  onNotificationAction: (callback) => {
    const listener = (_event, action) => callback(action);
    ipcRenderer.on("notification-action", listener);
    return () => {
      ipcRenderer.removeListener("notification-action", listener);
    };
  },
  onSystemShutdown: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("system-shutdown", listener);
    return () => {
      ipcRenderer.removeListener("system-shutdown", listener);
    };
  },
  windowControl: (action) => ipcRenderer.invoke("window-control", action)
});

contextBridge.exposeInMainWorld("aeroChatNotification", {
  action: (action) => ipcRenderer.invoke("notification-action", action),
  close: (id) => ipcRenderer.invoke("close-app-notification", id)
});
