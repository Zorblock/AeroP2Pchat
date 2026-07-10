import { Capacitor } from "@capacitor/core";
import { Clipboard } from "@capacitor/clipboard";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Preferences } from "@capacitor/preferences";

const CONFIG_KEY = "aero-p2p-chat.config.v1";

function getElectronApi() {
  return window.aeroChat || null;
}

function getCapacitorPlatform() {
  try {
    return Capacitor.getPlatform();
  } catch {
    return "web";
  }
}

function isNativeCapacitor() {
  return getCapacitorPlatform() !== "web";
}

async function readStoredConfig() {
  const result = await Preferences.get({ key: CONFIG_KEY });
  if (!result.value) {
    return {};
  }
  return JSON.parse(result.value);
}

async function writeStoredConfig(config) {
  await Preferences.set({
    key: CONFIG_KEY,
    value: JSON.stringify(config || {}),
  });
}

async function requestLocalNotificationPermission() {
  const current = await LocalNotifications.checkPermissions();
  if (current.display === "granted") {
    return true;
  }

  const requested = await LocalNotifications.requestPermissions();
  return requested.display === "granted";
}

async function showWebNotification({ title, body }) {
  if (!("Notification" in window)) {
    return { ok: false, unsupported: true };
  }

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }

  if (Notification.permission !== "granted") {
    return { ok: false, denied: true };
  }

  new Notification(title || "Aero P2P Chat", { body: body || "" });
  return { ok: true };
}

export function createPlatformApi() {
  const electron = getElectronApi();
  const capacitorPlatform = getCapacitorPlatform();
  const platform = electron?.platform || capacitorPlatform || "web";
  const isAndroid = platform === "android";
  const isElectron = Boolean(electron);

  return {
    platform,
    isAndroid,
    isElectron,
    hasNativeWindowControls: isElectron,
    hasDesktopIntegration: isElectron,
    supportsAutostart: isElectron,
    supportsCloseToTray: isElectron,
    supportsNativeUpdateInstall: platform === "win32",
    supportsDesktopScreenSources: isElectron,

    async loadConfig() {
      if (electron?.loadConfig) {
        const loaded = await electron.loadConfig();
        return loaded && typeof loaded === "object" ? loaded : {};
      }

      try {
        return await readStoredConfig();
      } catch {
        return {};
      }
    },

    async saveConfig(config) {
      if (electron?.saveConfig) {
        return electron.saveConfig(config);
      }

      await writeStoredConfig(config);
      return { ok: true };
    },

    async writeClipboard(text) {
      if (electron?.writeClipboard) {
        return electron.writeClipboard(text);
      }

      if (isNativeCapacitor()) {
        await Clipboard.write({ string: String(text || "") });
        return { ok: true };
      }

      await navigator.clipboard.writeText(String(text || ""));
      return { ok: true };
    },

    async fetchUpdateManifest(url) {
      if (electron?.fetchUpdateManifest) {
        return electron.fetchUpdateManifest(url);
      }

      const response = await fetch(`${url}?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.text();
    },

    async showNotification(details = {}) {
      if (electron?.showNotification) {
        return electron.showNotification(details);
      }

      if (isNativeCapacitor()) {
        const permitted = await requestLocalNotificationPermission();
        if (!permitted) {
          return { ok: false, denied: true };
        }

        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Date.now() % 2147483647),
              title: details.title || "Aero P2P Chat",
              body: details.body || "",
              schedule: { at: new Date(Date.now() + 100) },
              sound: details.silent ? undefined : "default",
            },
          ],
        });
        return { ok: true };
      }

      return showWebNotification(details);
    },

    async closeNotification(id) {
      if (electron?.closeNotification) {
        return electron.closeNotification(id);
      }
      return { ok: true };
    },

    async getNotificationState() {
      if (electron?.getNotificationState) {
        return electron.getNotificationState();
      }
      return {
        appFocused: document.visibilityState === "visible" && document.hasFocus(),
        systemDnd: false,
      };
    },

    async getScreenSources() {
      if (electron?.getScreenSources) {
        return electron.getScreenSources();
      }

      if (!navigator.mediaDevices?.getDisplayMedia) {
        return [];
      }

      return [
        {
          id: "display-media",
          name: "Screen",
          displayId: "",
          thumbnail: "",
          appIcon: "",
          webDisplayMedia: true,
        },
      ];
    },

    async getDisplayMedia(options = {}) {
      const displayMedia =
        navigator.mediaDevices?.getDisplayMedia?.bind(navigator.mediaDevices);
      if (!displayMedia) {
        throw new Error("Screen capture is not available on this platform.");
      }

      const profile = options.profile || {};
      const video = {
        frameRate: { ideal: options.fps || 30, max: options.fps || 30 },
      };
      if (profile.height > 0) {
        video.height = { ideal: profile.height };
      }

      return displayMedia({
        video,
        audio: Boolean(options.audio),
      });
    },

    installUpdate(details) {
      if (!electron?.installUpdate) {
        return Promise.reject(new Error("Native updates are not available here."));
      }
      return electron.installUpdate(details);
    },

    windowControl(action) {
      return electron?.windowControl?.(action) || Promise.resolve({ ok: false });
    },

    updateTrayState(state) {
      electron?.updateTrayState?.(state);
    },

    realtimeCleanupComplete() {
      electron?.realtimeCleanupComplete?.();
    },

    onUpdateProgress(callback) {
      return electron?.onUpdateProgress?.(callback) || null;
    },

    onCheckForUpdates(callback) {
      return electron?.onCheckForUpdates?.(callback) || null;
    },

    onDisconnect(callback) {
      return electron?.onDisconnect?.(callback) || null;
    },

    onNotificationAction(callback) {
      return electron?.onNotificationAction?.(callback) || null;
    },

    onSystemShutdown(callback) {
      return electron?.onSystemShutdown?.(callback) || null;
    },

    onTrayAction(callback) {
      return electron?.onTrayAction?.(callback) || null;
    },
  };
}
