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
  fetchUpdateManifest: (url) =>
    ipcRenderer.invoke("fetch-update-manifest", url),
  fetchChangelogFeed: () => ipcRenderer.invoke("fetch-changelog-feed"),
  onCheckForUpdates: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("check-for-updates", listener);
    return () => {
      ipcRenderer.removeListener("check-for-updates", listener);
    };
  },
  onDisconnect: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("disconnect-p2p", listener);
    return () => {
      ipcRenderer.removeListener("disconnect-p2p", listener);
    };
  },
  updateTrayState: (state) => ipcRenderer.send("update-tray-state", state),
  onTrayAction: (callback) => {
    const listener = (_event, action) => callback(action);
    ipcRenderer.on("tray-action", listener);
    return () => {
      ipcRenderer.removeListener("tray-action", listener);
    };
  },
  loadConfig: () => ipcRenderer.invoke("load-config"),
  saveConfig: (config) => ipcRenderer.invoke("save-config", config),
  getConfigPath: () => ipcRenderer.invoke("get-config-path"),
  getScreenSources: () => ipcRenderer.invoke("get-screen-sources"),
  writeClipboard: (text) => ipcRenderer.invoke("write-clipboard", text),
  getNotificationState: () => ipcRenderer.invoke("get-notification-state"),
  showNotification: (details) =>
    ipcRenderer.invoke("show-app-notification", details),
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
  realtimeCleanupComplete: () => ipcRenderer.send("realtime-cleanup-complete"),
  windowControl: (action) => ipcRenderer.invoke("window-control", action),
  log: (msg) => ipcRenderer.send("console-log", msg),
});

contextBridge.exposeInMainWorld("aeroChatNotification", {
  action: (action) => ipcRenderer.invoke("notification-action", action),
  close: (id) => ipcRenderer.invoke("close-app-notification", id),
  onShowToast: (callback) => {
    const listener = (_event, details) => callback(details);
    ipcRenderer.on("show-toast", listener);
    return () => ipcRenderer.removeListener("show-toast", listener);
  },
  onCloseToast: (callback) => {
    const listener = (_event, id) => callback(id);
    ipcRenderer.on("close-toast", listener);
    return () => ipcRenderer.removeListener("close-toast", listener);
  },
  updateToastHeight: (height) =>
    ipcRenderer.send("update-toast-height", height),
});
