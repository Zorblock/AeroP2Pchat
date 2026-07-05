const eventListeners = {
  "notification-action": new Set(),
  "system-shutdown": new Set(),
  "update-progress": new Set(),
};

function getBinding(name) {
  return globalThis.bindings?.[name];
}

async function callBinding(name, ...args) {
  const binding = getBinding(name);
  if (typeof binding !== "function") {
    throw new Error(`Deno binding '${name}' is not available.`);
  }
  return await binding(...args);
}

async function writeClipboard(text) {
  const result = await callBinding("writeClipboard", String(text || "")).catch(
    () => null,
  );
  if (result?.ok) {
    return result;
  }
  await navigator.clipboard.writeText(String(text || ""));
  return { ok: true };
}

function addListener(type, callback) {
  const listeners = eventListeners[type];
  if (!listeners || typeof callback !== "function") {
    return () => {};
  }
  listeners.add(callback);
  return () => listeners.delete(callback);
}

async function pollDenoEvents() {
  if (!getBinding("takeEvents")) {
    return;
  }

  try {
    const events = await callBinding("takeEvents");
    if (!Array.isArray(events)) {
      return;
    }

    for (const event of events) {
      const listeners = eventListeners[event?.type];
      if (!listeners) {
        continue;
      }
      for (const listener of listeners) {
        listener(event.payload);
      }
    }
  } catch {
    // Event polling is best-effort; renderer features continue without it.
  }
}

const platform = await callBinding("getPlatform").catch(() => {
  const value = navigator.platform.toLowerCase();
  if (value.includes("win")) return "win32";
  if (value.includes("mac")) return "darwin";
  return "linux";
});

window.aeroChat = {
  platform,
  installUpdate: () => Promise.resolve({ ok: false, denoAutoUpdate: true }),
  onUpdateProgress: (callback) => addListener("update-progress", callback),
  fetchUpdateManifest: async (url) => {
    const response = await fetch(`${url}?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }
    return { ok: true, text: await response.text() };
  },
  loadConfig: () => callBinding("loadConfig"),
  saveConfig: (config) => callBinding("saveConfig", config),
  getConfigPath: () => callBinding("getConfigPath"),
  getScreenSources: () => callBinding("getScreenSources"),
  writeClipboard,
  getNotificationState: () => callBinding("getNotificationState"),
  showNotification: (details) => callBinding("showNotification", details),
  closeNotification: (id) => callBinding("closeNotification", id),
  onNotificationAction: (callback) => addListener("notification-action", callback),
  onSystemShutdown: (callback) => addListener("system-shutdown", callback),
  realtimeCleanupComplete: () => callBinding("realtimeCleanupComplete"),
  windowControl: (action) => callBinding("windowControl", action),
};

window.aeroChatNotification = {
  action: (action) => callBinding("notificationAction", action),
  close: (id) => callBinding("closeNotification", id),
};

setInterval(pollDenoEvents, 500);
pollDenoEvents();
