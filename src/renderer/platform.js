import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { Clipboard } from "@capacitor/clipboard";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Preferences } from "@capacitor/preferences";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { FileOpener } from "@capacitor-community/file-opener";
import { App } from "@capacitor/app";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { StatusBar, Style } from "@capacitor/status-bar";
import { BackgroundMode } from "@anuradev/capacitor-background-mode";

const CONFIG_KEY = "aero-p2p-chat.config.v1";

function getChromeStorage() {
  const chromeApi = globalThis.chrome;
  if (!chromeApi?.runtime?.id || !chromeApi?.storage?.local) {
    return null;
  }
  return chromeApi.storage.local;
}

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
  const chromeStorage = getChromeStorage();
  if (chromeStorage) {
    const stored = await chromeStorage.get(CONFIG_KEY);
    return stored[CONFIG_KEY] || {};
  }

  const result = await Preferences.get({ key: CONFIG_KEY });
  if (!result.value) {
    return {};
  }
  return JSON.parse(result.value);
}

async function writeStoredConfig(config) {
  const chromeStorage = getChromeStorage();
  if (chromeStorage) {
    await chromeStorage.set({ [CONFIG_KEY]: config || {} });
    return;
  }

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
  const isChromeExtension = Boolean(getChromeStorage());
  const capacitorPlatform = getCapacitorPlatform();
  const platform = electron?.platform || (isChromeExtension ? "chrome-extension" : capacitorPlatform || "web");
  const isAndroid = platform === "android";
  const isElectron = Boolean(electron);
  const isWindowsStore = Boolean(electron?.isWindowsStore);
  let androidUpdateProgressCallback = null;

  return {
    platform,
    isAndroid,
    isElectron,
    isWindowsStore,
    isChromeExtension,
    hasNativeWindowControls: isElectron,
    hasDesktopIntegration: isElectron,
    supportsAutostart: isElectron,
    supportsCloseToTray: isElectron,
    supportsNativeUpdateInstall: platform === "win32" && !isWindowsStore,
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

    async fetchChangelogFeed(url) {
      if (electron?.fetchChangelogFeed) {
        const response = await electron.fetchChangelogFeed();
        if (!response?.ok) {
          throw new Error(response?.error || "Could not load the changelog.");
        }
        return response.text;
      }

      if (isNativeCapacitor()) {
        const response = await CapacitorHttp.get({ url });
        if (response.status < 200 || response.status >= 300) {
          throw new Error(`HTTP ${response.status}`);
        }
        return typeof response.data === "string"
          ? response.data
          : String(response.data || "");
      }

      const response = await fetch(url, { cache: "no-store" });
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
              // Android requires a monochrome small icon in the status bar.
              // This resource is our Aero chat mark, not Capacitor's info icon.
              smallIcon: "ic_stat_aero",
              schedule: { at: new Date(Date.now() + 100) },
              sound: details.silent ? undefined : "default",
              extra: details.extra || null
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

    async installUpdate(details) {
      if (electron?.installUpdate) {
        return electron.installUpdate(details);
      }

      if (isAndroid) {
        if (!details.url) {
          throw new Error("No download URL provided for Android update.");
        }

        let progressListener = null;
        if (androidUpdateProgressCallback) {
          progressListener = await Filesystem.addListener("progress", (progress) => {
            const percent = progress.contentLength > 0 ? Math.round((progress.bytes / progress.contentLength) * 100) : 0;
            androidUpdateProgressCallback({ phase: "download", percent });
          });
        }

        try {
          const downloadResult = await Filesystem.downloadFile({
            url: details.url,
            path: "update.apk",
            directory: Directory.Cache,
            progress: true,
          });

          if (androidUpdateProgressCallback) {
            androidUpdateProgressCallback({ phase: "install" });
          }

          await FileOpener.open({
            filePath: downloadResult.path,
            contentType: "application/vnd.android.package-archive",
          });

          if (progressListener) {
            await progressListener.remove();
          }
          return { ok: true };
        } catch (error) {
          if (progressListener) {
            await progressListener.remove();
          }
          throw error;
        }
      }

      throw new Error("Native updates are not available here.");
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
      if (electron?.onUpdateProgress) {
        return electron.onUpdateProgress(callback);
      }
      
      if (isAndroid) {
        androidUpdateProgressCallback = callback;
        return () => {
          if (androidUpdateProgressCallback === callback) {
            androidUpdateProgressCallback = null;
          }
        };
      }
      
      return null;
    },

    onCheckForUpdates(callback) {
      return electron?.onCheckForUpdates?.(callback) || null;
    },

    openMicrosoftStore() {
      return electron?.openMicrosoftStore?.() || {
        ok: false,
        error: "Microsoft Store is not available.",
      };
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

    async vibrate(style = "light") {
      if (!isNativeCapacitor()) return;
      const hapticStyle = style === "heavy" ? ImpactStyle.Heavy : style === "medium" ? ImpactStyle.Medium : ImpactStyle.Light;
      try {
        await Haptics.impact({ style: hapticStyle });
      } catch (e) {}
    },

    onBackButton(callback) {
      if (!isNativeCapacitor()) return;
      App.addListener("backButton", callback);
    },

    async minimizeApp() {
      if (!isNativeCapacitor()) return;
      await App.minimizeApp();
    },

    async initMobile() {
      if (!isNativeCapacitor()) return;
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        if (isAndroid) {
          await StatusBar.setBackgroundColor({ color: "#09090b" });
        }
        
        LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
          const extra = notificationAction.notification.extra;
          if (extra && extra.peerId) {
            window.dispatchEvent(new CustomEvent('aero:open-chat', { detail: { peerId: extra.peerId } }));
          }
        });
      } catch (e) {}
    },

    async enableBackgroundMode(activeConnections = 0) {
      if (!isNativeCapacitor()) return;
      try {
        await BackgroundMode.enable({
          title: "Aero P2P Chat",
          text: activeConnections === 1 ? "1 aktive Verbindung" : `${activeConnections} aktive Verbindungen`,
          hidden: false,
          silent: true,
          icon: "ic_stat_aero",
          allowClose: true,
          closeTitle: "Beenden",
          disableWebViewOptimization: true
        });
      } catch (e) {}
    },

    async disableBackgroundMode() {
      if (!isNativeCapacitor()) return;
      try {
        await BackgroundMode.disable();
      } catch (e) {}
    },

    async updateBackgroundNotification(activeConnections = 0) {
      if (!isNativeCapacitor()) return;
      try {
        await BackgroundMode.updateNotification({
          title: "Aero P2P Chat",
          text: activeConnections === 1 ? "1 aktive Verbindung" : `${activeConnections} aktive Verbindungen`,
          icon: "ic_stat_aero",
        });
      } catch (e) {}
    }
  };
}
