const tauri = window.__TAURI__;
const invoke = tauri?.core?.invoke;
const listen = tauri?.event?.listen;
const currentWindow =
  tauri?.window?.getCurrentWindow?.() ||
  tauri?.webviewWindow?.getCurrentWebviewWindow?.();

function getPlatform() {
  const platform = navigator.platform.toLowerCase();
  if (platform.includes("win")) return "win32";
  if (platform.includes("mac")) return "darwin";
  return "linux";
}

async function writeClipboard(text) {
  if (invoke) {
    return invoke("write_clipboard", { text: String(text || "") });
  }
  await navigator.clipboard.writeText(String(text || ""));
  return { ok: true };
}

async function showNotification(details = {}) {
  if (!("Notification" in window)) {
    return { ok: true, unsupported: true };
  }

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }

  if (Notification.permission !== "granted") {
    return { ok: true, suppressed: true };
  }

  const notification = new Notification(details.title || "Aero P2P Chat", {
    body: details.body || "",
    silent: Boolean(details.silent),
  });
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
  return { ok: true, id: details.id || "" };
}

async function windowControl(action) {
  if (invoke) {
    return invoke("window_control", { action });
  }

  if (action === "minimize") await currentWindow?.minimize?.();
  if (action === "maximize") {
    const maximized = await currentWindow?.isMaximized?.();
    if (maximized) {
      await currentWindow?.unmaximize?.();
    } else {
      await currentWindow?.maximize?.();
    }
  }
  if (action === "close") await currentWindow?.close?.();
  return { ok: true };
}

function onTauriEvent(event, callback) {
  if (!listen) {
    return () => {};
  }

  let unlisten = null;
  listen(event, ({ payload }) => callback(payload)).then((fn) => {
    unlisten = fn;
  });
  return () => unlisten?.();
}

window.aeroChat = {
  platform: getPlatform(),
  installUpdate: (details) => invoke?.("install_update", { details }),
  onUpdateProgress: (callback) => onTauriEvent("update-progress", callback),
  fetchUpdateManifest: (url) => invoke?.("fetch_update_manifest", { url }),
  loadConfig: () => invoke?.("load_config") ?? Promise.resolve({}),
  saveConfig: (config) => invoke?.("save_config", { config }) ?? Promise.resolve({ ok: true }),
  getConfigPath: () => invoke?.("get_config_path") ?? Promise.resolve(""),
  getScreenSources: () => Promise.resolve([]),
  writeClipboard,
  getNotificationState: () =>
    Promise.resolve({
      appFocused: document.visibilityState === "visible" && document.hasFocus(),
      systemDnd: false,
    }),
  showNotification,
  closeNotification: () => Promise.resolve({ ok: true }),
  onNotificationAction: () => () => {},
  onSystemShutdown: (callback) => onTauriEvent("system-shutdown", callback),
  realtimeCleanupComplete: () =>
    invoke?.("realtime_cleanup_complete").catch(() => {}) ?? Promise.resolve(),
  windowControl,
};
