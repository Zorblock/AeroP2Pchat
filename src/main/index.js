const {
  app,
  BrowserWindow,
  Menu,
  Notification,
  Tray,
  clipboard,
  desktopCapturer,
  ipcMain,
  powerMonitor,
  screen,
  shell,
  session,
} = require("electron");
const { createWriteStream, existsSync, readFileSync } = require("node:fs");
const { mkdir, mkdtemp, readFile, rm, writeFile } = require("node:fs/promises");
const { createHash } = require("node:crypto");
const { get } = require("node:https");
const { tmpdir } = require("node:os");
const { basename, dirname, join } = require("node:path");
const { execFileSync, spawn } = require("node:child_process");
const projectConfig = __PROJECT_CONFIG__;

const windowIcon =
  process.platform === "win32"
    ? join(__dirname, "../../assets/app.ico")
    : join(__dirname, "../../assets/linux-icons/512x512.png");
const releaseHost = "github.com";
const releasePathPrefix = `/${projectConfig.repo}/releases/`;
const latestManifestUrl = `https://${releaseHost}${releasePathPrefix}latest/download/latest.yml`;
const appDisplayName = projectConfig.app.name;
const userConfigFileName = "config.json";
const updateManifestTimeoutMs = 12000;
const updateManifestRetryDelayMs = 800;
const defaultSidebarWidth = 230;
const minSidebarWidth = 170;
const maxSidebarWidth = 360;
const defaultMicBoost = 100;
const defaultMicSensitivity = 55;
const defaultMicNoiseReduction = 55;
const defaultMicEqLow = 0;
const defaultMicEqMid = 0;
const defaultMicEqHigh = 0;
const allowMultipleInstances =
  process.env.AERO_CHAT_ALLOW_MULTI_INSTANCE === "1";
const autostartDesktopFileName = projectConfig.linux.autostartDesktopFileName;
let mainWindow = null;
let tray = null;
let appConfig = {};
let forceQuit = false;
let systemShutdownStarted = false;
let delayedQuitStarted = false;
let delayedQuitTimer = null;
const activeNotifications = new Map();
let lastSystemDndCheck = { checkedAt: 0, enabled: false };

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
app.name = projectConfig.app.name || "Aero P2P Chat";
if (app.isPackaged) {
  app.setAppUserModelId(projectConfig.app.id);
}

if (process.env.AERO_CHAT_USER_DATA_DIR) {
  app.setPath("userData", process.env.AERO_CHAT_USER_DATA_DIR);
}

if (!allowMultipleInstances) {
  const hasSingleInstanceLock = app.requestSingleInstanceLock();

  if (!hasSingleInstanceLock) {
    app.quit();
  } else {
    app.on("second-instance", () => {
      if (!mainWindow) {
        return;
      }

      showMainWindow();
    });
  }
}

function getConfigPath() {
  return join(app.getPath("userData"), userConfigFileName);
}

function getDefaultAppSettings() {
  return {
    autostart: true,
    startHidden: true,
    closeToTray: true,
    readReceipts: true,
    sidebarWidth: defaultSidebarWidth,
    theme: "light",
    presenceStatus: "online",
  };
}

function getDefaultAudioSettings() {
  return {
    inputDeviceId: "default",
    cameraDeviceId: "default",
    outputDeviceId: "default",
    remoteVolume: 100,
    micMode: "auto",
    micSensitivity: defaultMicSensitivity,
    micBoost: defaultMicBoost,
    micNoiseReduction: defaultMicNoiseReduction,
    micEqLow: defaultMicEqLow,
    micEqMid: defaultMicEqMid,
    micEqHigh: defaultMicEqHigh,
    micProfile: "voice-isolation",
  };
}

function normalizeConfig(config = {}) {
  const settings = {
    ...getDefaultAppSettings(),
    ...(config.appSettings && typeof config.appSettings === "object"
      ? config.appSettings
      : {}),
  };

  config.appSettings = {
    autostart: Boolean(settings.autostart),
    startHidden: Boolean(settings.startHidden),
    closeToTray: settings.closeToTray !== false,
    readReceipts: settings.readReceipts !== false,
    presenceStatus: ["online", "dnd", "offline"].includes(
      settings.presenceStatus,
    )
      ? settings.presenceStatus
      : "online",
    theme: ["light", "dark"].includes(settings.theme)
      ? settings.theme
      : "light",
    sidebarWidth: Number.isFinite(settings.sidebarWidth)
      ? Math.round(
          Math.max(
            minSidebarWidth,
            Math.min(maxSidebarWidth, settings.sidebarWidth),
          ),
        )
      : defaultSidebarWidth,
  };

  if (!config.appSettings.autostart) {
    config.appSettings.startHidden = false;
  }

  const audio = {
    ...getDefaultAudioSettings(),
    ...(config.audio && typeof config.audio === "object" ? config.audio : {}),
  };

  config.audio = {
    inputDeviceId:
      typeof audio.inputDeviceId === "string" ? audio.inputDeviceId : "default",
    cameraDeviceId:
      typeof audio.cameraDeviceId === "string"
        ? audio.cameraDeviceId
        : "default",
    outputDeviceId:
      typeof audio.outputDeviceId === "string"
        ? audio.outputDeviceId
        : "default",
    remoteVolume: Number.isFinite(audio.remoteVolume)
      ? Math.round(Math.max(0, Math.min(100, audio.remoteVolume)))
      : 100,
    micMode: audio.micMode === "manual" ? "manual" : "auto",
    micSensitivity: Number.isFinite(audio.micSensitivity)
      ? Math.round(Math.max(0, Math.min(100, audio.micSensitivity)))
      : defaultMicSensitivity,
    micBoost: Number.isFinite(audio.micBoost)
      ? Math.round(Math.max(0, Math.min(200, audio.micBoost)))
      : defaultMicBoost,
    micNoiseReduction: Number.isFinite(audio.micNoiseReduction)
      ? Math.round(Math.max(0, Math.min(100, audio.micNoiseReduction)))
      : defaultMicNoiseReduction,
    micEqLow: Number.isFinite(audio.micEqLow)
      ? Math.round(Math.max(-12, Math.min(12, audio.micEqLow)))
      : defaultMicEqLow,
    micEqMid: Number.isFinite(audio.micEqMid)
      ? Math.round(Math.max(-12, Math.min(12, audio.micEqMid)))
      : defaultMicEqMid,
    micEqHigh: Number.isFinite(audio.micEqHigh)
      ? Math.round(Math.max(-12, Math.min(12, audio.micEqHigh)))
      : defaultMicEqHigh,
    micProfile: ["voice-isolation", "studio", "custom"].includes(
      audio.micProfile,
    )
      ? audio.micProfile
      : "voice-isolation",
  };

  return config;
}

async function loadConfig() {
  try {
    return normalizeConfig(JSON.parse(await readFile(getConfigPath(), "utf8")));
  } catch (error) {
    if (error.code === "ENOENT") {
      return normalizeConfig({});
    }
    throw error;
  }
}

async function saveConfig(config) {
  const normalizedConfig = normalizeConfig(config || {});
  const configPath = getConfigPath();
  await mkdir(app.getPath("userData"), { recursive: true });
  await writeFile(
    configPath,
    `${JSON.stringify(normalizedConfig, null, 2)}`,
    "utf8",
  );
  appConfig = normalizedConfig;
  await applyAutostartSettings();
  return { ok: true, path: configPath };
}

function getAutostartArgs() {
  return appConfig.appSettings?.startHidden ? ["--hidden"] : [];
}

function getLinuxAutostartPath() {
  return join(
    app.getPath("home"),
    ".config",
    "autostart",
    autostartDesktopFileName,
  );
}

function quoteDesktopValue(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

async function applyLinuxAutostartSettings() {
  const autostartPath = getLinuxAutostartPath();
  if (!appConfig.appSettings?.autostart) {
    await rm(autostartPath, { force: true });
    return;
  }

  const executable = process.env.APPIMAGE || process.execPath;
  const args = getAutostartArgs().map(quoteDesktopValue).join(" ");
  const desktopEntry = [
    "[Desktop Entry]",
    "Type=Application",
    `Name=${appDisplayName}`,
    `Exec=${quoteDesktopValue(executable)}${args ? ` ${args}` : ""}`,
    "Terminal=false",
    "X-GNOME-Autostart-enabled=true",
  ].join("\n");

  await mkdir(dirname(autostartPath), { recursive: true });
  await writeFile(autostartPath, `${desktopEntry}`, "utf8");
}

async function applyAutostartSettings() {
  if (process.platform === "linux") {
    await applyLinuxAutostartSettings();
    return;
  }

  app.setLoginItemSettings({
    openAtLogin: Boolean(appConfig.appSettings?.autostart),
    path: process.execPath,
    args: getAutostartArgs(),
  });
}

function shouldStartHidden() {
  return process.argv.includes("--hidden");
}

function showMainWindow() {
  if (!mainWindow) {
    createWindow({ hidden: false });
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.show();
  mainWindow.focus();
}

let trayState = {
  peerId: null,
  isMuted: false,
  isDeafened: false,
  status: "online",
  theme: "light",
  autostart: true,
  closeToTray: true,
};

function updateTrayMenu() {
  if (!tray) {
    return;
  }

  const { nativeImage } = require("electron");
  const menuIcon = nativeImage.createFromPath(windowIcon).resize({ width: 16, height: 16 });

  const sendTrayAction = (action, value) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("tray-action", { action, value });
    }
  };

  const menuTemplate = [
    {
      label: `${appDisplayName} v${app.getVersion()}`,
      icon: menuIcon,
      enabled: false,
    },
    { type: "separator" },
  ];

  if (trayState.peerId) {
    menuTemplate.push({
      label: `Copy Peer ID`,
      click: () => {
        clipboard.writeText(trayState.peerId);
      },
    });
  }

  menuTemplate.push(
    {
      label: "Online Status",
      submenu: [
        { label: "Online", type: "radio", checked: trayState.status === "online", click: () => sendTrayAction("set-status", "online") },
        { label: "Do Not Disturb", type: "radio", checked: trayState.status === "dnd", click: () => sendTrayAction("set-status", "dnd") },
        { label: "Offline / Hidden", type: "radio", checked: trayState.status === "offline", click: () => sendTrayAction("set-status", "offline") },
      ]
    },
    { type: "separator" },
    {
      label: "Mute Microphone",
      type: "checkbox",
      checked: trayState.isMuted,
      click: () => sendTrayAction("toggle-mute"),
    },
    {
      label: "Deafen Audio",
      type: "checkbox",
      checked: trayState.isDeafened,
      click: () => sendTrayAction("toggle-deafen"),
    },
    { type: "separator" },
    {
      label: "Quick Settings",
      submenu: [
        { label: "Dark Mode", type: "checkbox", checked: trayState.theme === "dark", click: () => sendTrayAction("toggle-theme") },
        { label: "Launch on Startup", type: "checkbox", checked: trayState.autostart, click: () => sendTrayAction("toggle-autostart") },
        { label: "Close to Tray", type: "checkbox", checked: trayState.closeToTray, click: () => sendTrayAction("toggle-close-to-tray") },
      ]
    },
    { type: "separator" },
    {
      label: "Open Aero P2P Chat",
      click: showMainWindow,
    },
    {
      label: "Check for Updates",
      click: () => sendTrayAction("check-for-updates"),
    },
    {
      label: "Disconnect All",
      click: () => sendTrayAction("disconnect-p2p"),
    },
    {
      label: "Hide to Tray",
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.hide();
        }
      },
    },
  );

  if (!app.isPackaged) {
    menuTemplate.push(
      { type: "separator" },
      {
        label: "Dev",
        submenu: [
          {
            label: "Toggle Developer Tools",
            click: () => {
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.toggleDevTools();
              }
            },
          },
          {
            label: "Restart App",
            click: () => {
              app.relaunch();
              app.quit();
            },
          },
          {
            label: "Clear App Data & Restart",
            click: () => {
              const { dialog } = require("electron");
              const response = dialog.showMessageBoxSync({
                type: "warning",
                buttons: ["Yes, Clear Data", "Cancel"],
                defaultId: 1,
                title: "Clear App Data?",
                message:
                  "Are you sure you want to completely clear all app settings and data? This cannot be undone.",
              });

              if (response === 0) {
                session.defaultSession.clearStorageData().then(() => {
                  app.relaunch();
                  app.quit();
                });
              }
            },
          },
        ],
      },
    );
  }

  menuTemplate.push(
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        forceQuit = true;
        app.quit();
      },
    },
  );

  tray.setContextMenu(Menu.buildFromTemplate(menuTemplate));
}

function createTray() {
  if (tray) {
    updateTrayMenu();
    return tray;
  }

  tray = new Tray(windowIcon);
  tray.setToolTip(appDisplayName);
  tray.on("click", showMainWindow);
  updateTrayMenu();
  return tray;
}

function runStatusCommand(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 900,
      windowsHide: true,
    }).trim();
  } catch {
    return "";
  }
}

function isWindowsNotificationDisabled() {
  const shellState = runStatusCommand("powershell.exe", [
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    "Add-Type 'using System; using System.Runtime.InteropServices; public static class AeroNotifyState { [DllImport(\"shell32.dll\")] public static extern int SHQueryUserNotificationState(out int state); }'; $state = 0; [void][AeroNotifyState]::SHQueryUserNotificationState([ref]$state); [Console]::Write($state)",
  ]);
  if (/^\d+$/.test(shellState)) {
    return shellState !== "5";
  }

  const settingsOutput = runStatusCommand("reg.exe", [
    "query",
    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings",
    "/v",
    "NOC_GLOBAL_SETTING_TOASTS_ENABLED",
  ]);
  if (
    /\bNOC_GLOBAL_SETTING_TOASTS_ENABLED\b[\s\S]*\b0x0\b/i.test(settingsOutput)
  ) {
    return true;
  }

  const pushOutput = runStatusCommand("reg.exe", [
    "query",
    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\PushNotifications",
    "/v",
    "ToastEnabled",
  ]);
  return /\bToastEnabled\b[\s\S]*\b0x0\b/i.test(pushOutput);
}

function isLinuxNotificationDisabled() {
  const showBanners = runStatusCommand("gsettings", [
    "get",
    "org.gnome.desktop.notifications",
    "show-banners",
  ]);
  if (showBanners) {
    return showBanners === "false";
  }

  return false;
}

function isSystemDoNotDisturbEnabled() {
  if (process.env.AERO_CHAT_ASSUME_SYSTEM_DND === "1") {
    return true;
  }

  const now = Date.now();
  if (now - lastSystemDndCheck.checkedAt < 2000) {
    return lastSystemDndCheck.enabled;
  }

  const enabled =
    process.platform === "win32"
      ? isWindowsNotificationDisabled()
      : process.platform === "linux"
        ? isLinuxNotificationDisabled()
        : false;
  lastSystemDndCheck = { checkedAt: now, enabled };
  return enabled;
}

function getNotificationState() {
  return {
    appFocused: Boolean(mainWindow?.isVisible() && mainWindow?.isFocused()),
    systemDnd: isSystemDoNotDisturbEnabled(),
  };
}

function shouldSuppressNotification({ showWhenFocused = false } = {}) {
  const state = getNotificationState();
  return Boolean(state.systemDnd || (!showWhenFocused && state.appFocused));
}

function getRendererAssetPath(fileName) {
  if (process.env.ELECTRON_RENDERER_URL) {
    return join(__dirname, "../../public", fileName);
  }

  return join(__dirname, "../renderer", fileName);
}

function getMimeType(filePath) {
  const lowerPath = String(filePath).toLowerCase();
  if (lowerPath.endsWith(".png")) return "image/png";
  if (lowerPath.endsWith(".ogg")) return "audio/ogg";
  if (lowerPath.endsWith(".wav")) return "audio/wav";
  return "application/octet-stream";
}

function fileToDataUrl(filePath) {
  try {
    const bytes = readFileSync(filePath);
    return `data:${getMimeType(filePath)};base64,${bytes.toString("base64")}`;
  } catch {
    return "";
  }
}

function findRendererAssetDataUrl(candidates) {
  for (const candidate of candidates) {
    const assetPath = getRendererAssetPath(candidate);
    if (existsSync(assetPath)) {
      return fileToDataUrl(assetPath);
    }
  }

  return "";
}

function findNotificationSound(baseName) {
  const candidates = [
    `${baseName}.ogg`,
    `${baseName}.wav`,
    join("sound", `${baseName}.ogg`),
    join("sound", `${baseName}.wav`),
  ];

  return findRendererAssetDataUrl(candidates);
}

function findNotificationLogo() {
  return findRendererAssetDataUrl(["app.png", "boot-logo.png"]);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function sendNotificationAction(action) {
  if (action?.openWindow) {
    showMainWindow();
  }
  mainWindow?.webContents.send("notification-action", action);
}

function showAppNotification(details = {}) {
  if (shouldSuppressNotification({ showWhenFocused: Boolean(details.showWhenFocused) })) {
    return { ok: true, suppressed: true };
  }

  const kind = details.kind === "call" ? "call" : "message";
  const notificationId = details.id || `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  if (activeNotifications.has(notificationId)) {
    return { ok: true, id: notificationId, existing: true };
  }

  const title = String(details.title || (kind === "call" ? "Incoming call" : "New message"));
  const body = String(details.body || "");
  const peerId = details.peerId || "";
  const callId = details.callId || "";

  // The 'actions' array adds Accept/Decline buttons to the native notification on supported platforms
  const notification = new Notification({
    title,
    body,
    icon: windowIcon,
    silent: Boolean(details.silent),
    actions: kind === "call" ? [
      { type: 'button', text: 'Accept' },
      { type: 'button', text: 'Decline' }
    ] : undefined
  });

  notification.on('action', (event, index) => {
    if (kind === "call") {
      if (index === 0) {
        sendNotificationAction({ type: 'accept-call', openWindow: true, id: notificationId, kind, peerId, callId });
      } else if (index === 1) {
        sendNotificationAction({ type: 'decline-call', id: notificationId, kind, peerId, callId });
      }
    }
  });

  notification.on('click', () => {
    sendNotificationAction({ type: 'open', openWindow: true, id: notificationId, kind, peerId, callId });
  });

  notification.on('close', () => {
    activeNotifications.delete(notificationId);
  });

  activeNotifications.set(notificationId, notification);
  notification.show();

  if (kind === "message") {
    setTimeout(() => {
      const n = activeNotifications.get(notificationId);
      if (n) {
        n.close();
        activeNotifications.delete(notificationId);
      }
    }, 12000);
  }

  return { ok: true, id: notificationId };
}

function closeAppNotification(id) {
  const notification = activeNotifications.get(String(id));
  if (notification) {
    notification.close();
    activeNotifications.delete(String(id));
  }
  return { ok: true };
}
function getAppNotificationState() {
  return getNotificationState();
}

function notifyRendererShutdown(reason = "quit") {
  systemShutdownStarted = true;
  forceQuit = true;

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("system-shutdown", { reason });
  }
}

function finishDelayedQuit() {
  if (delayedQuitTimer) {
    clearTimeout(delayedQuitTimer);
    delayedQuitTimer = null;
  }

  app.quit();
}

function assertTrustedInstallerUrl(rawUrl) {
  const url = new URL(rawUrl);
  const isTrustedHost = url.hostname === releaseHost;
  const isTrustedPath = url.pathname.startsWith(releasePathPrefix);
  const trustedInstallerNames = new Set([
    projectConfig.release.windowsSetupAsset,
  ]);
  const isInstaller = trustedInstallerNames.has(basename(url.pathname));

  if (!isTrustedHost || !isTrustedPath || !isInstaller) {
    throw new Error("Refused untrusted update URL.");
  }

  return url;
}

function assertTrustedManifestUrl(rawUrl) {
  const url = new URL(rawUrl);
  if (url.toString() !== latestManifestUrl) {
    throw new Error("Refused untrusted update manifest URL.");
  }
  return url;
}

function fetchText(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const request = get(url, (response) => {
      if (
        [301, 302, 303, 307, 308].includes(response.statusCode) &&
        response.headers.location
      ) {
        response.resume();
        if (redirects >= 5) {
          reject(new Error("Too many update manifest redirects."));
          return;
        }
        fetchText(new URL(response.headers.location, url), redirects + 1).then(
          resolve,
          reject,
        );
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(
          new Error(`Update manifest failed with HTTP ${response.statusCode}.`),
        );
        return;
      }

      response.setEncoding("utf8");
      let text = "";
      response.on("data", (chunk) => {
        text += chunk;
      });
      response.on("end", () => resolve(text));
    });

    request.on("error", reject);
    request.setTimeout(updateManifestTimeoutMs, () => {
      request.destroy(new Error("Update manifest request timed out."));
    });
  });
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchTextWithRetry(url, attempts = 2) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetchText(url);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await wait(updateManifestRetryDelayMs);
      }
    }
  }

  throw lastError;
}

async function fetchUpdateManifest(rawUrl) {
  const url = assertTrustedManifestUrl(rawUrl);
  return fetchTextWithRetry(url);
}

function downloadFile(url, targetPath, onProgress = () => {}, redirects = 0) {
  return new Promise((resolve, reject) => {
    const request = get(url, (response) => {
      if (
        [301, 302, 303, 307, 308].includes(response.statusCode) &&
        response.headers.location
      ) {
        response.resume();
        if (redirects >= 5) {
          reject(new Error("Too many update download redirects."));
          return;
        }

        downloadFile(
          new URL(response.headers.location, url),
          targetPath,
          onProgress,
          redirects + 1,
        ).then(resolve, reject);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(
          new Error(`Update download failed with HTTP ${response.statusCode}.`),
        );
        return;
      }

      const file = createWriteStream(targetPath);
      const totalBytes = Number(response.headers["content-length"]) || 0;
      let receivedBytes = 0;

      response.on("data", (chunk) => {
        receivedBytes += chunk.length;
        if (totalBytes > 0) {
          onProgress({
            phase: "download",
            percent: Math.min(
              100,
              Math.round((receivedBytes / totalBytes) * 100),
            ),
            receivedBytes,
            totalBytes,
          });
        } else {
          onProgress({
            phase: "download",
            percent: null,
            receivedBytes,
            totalBytes: null,
          });
        }
      });

      response.pipe(file);
      file.on("finish", () => {
        onProgress({
          phase: "download",
          percent: 100,
          receivedBytes: totalBytes || receivedBytes,
          totalBytes: totalBytes || receivedBytes,
        });
        file.close(resolve);
      });
      file.on("error", reject);
    });

    request.on("error", reject);
  });
}

function getFileHash(filePath, algorithm, encoding = "hex") {
  return createHash(algorithm).update(readFileSync(filePath)).digest(encoding);
}

function verifyUpdateDownload(
  filePath,
  expectedSha256 = "",
  expectedSha512 = "",
) {
  if (!expectedSha256 || !expectedSha512) {
    throw new Error("Update manifest is missing installer checksums.");
  }

  if (expectedSha256) {
    const actualSha256 = getFileHash(filePath, "sha256", "hex").toLowerCase();
    if (actualSha256 !== String(expectedSha256).toLowerCase()) {
      throw new Error("Update download SHA256 did not match latest.yml.");
    }
  }

  if (expectedSha512) {
    const actualSha512 = getFileHash(filePath, "sha512", "base64");
    if (actualSha512 !== String(expectedSha512)) {
      throw new Error("Update download SHA512 did not match latest.yml.");
    }
  }
}

async function installWindowsUpdate(
  rawUrl,
  version,
  expectedSha256 = "",
  expectedSha512 = "",
  onProgress = () => {},
) {
  if (process.platform !== "win32") {
    throw new Error("Setup updates are only available on Windows.");
  }
  if (!app.isPackaged) {
    throw new Error("Update install is only available in the packaged app.");
  }

  const url = assertTrustedInstallerUrl(rawUrl);
  const updateDir = await mkdtemp(join(tmpdir(), "aero-p2p-update-"));
  const setupPath = join(
    updateDir,
    `${projectConfig.release.windowsSetupBaseName}-${version || "latest"}.exe`,
  );

  onProgress({
    phase: "download",
    percent: 0,
    receivedBytes: 0,
    totalBytes: null,
  });
  await downloadFile(url, setupPath, onProgress);
  onProgress({ phase: "verify", percent: 100 });
  verifyUpdateDownload(setupPath, expectedSha256, expectedSha512);
  onProgress({ phase: "install", percent: 100 });

  const setupArgs = [
    "/SILENT",
    "/SUPPRESSMSGBOXES",
    "/NORESTART",
    "/FORCECLOSEAPPLICATIONS",
    "/RESTARTAPPLICATIONS",
  ];
  const updater = spawn(setupPath, setupArgs, {
    detached: true,
    stdio: "ignore",
    windowsHide: false,
  });
  updater.unref();

  setTimeout(() => {
    forceQuit = true;
    app.quit();
  }, 250);
  return { ok: true };
}

function createWindow({ hidden = false } = {}) {
  const initialTheme = appConfig?.appSettings?.theme === "dark" ? "dark" : "light";
  const win = new BrowserWindow({
    width: 760,
    height: 560,
    minWidth: 620,
    minHeight: 440,
    title: appDisplayName,
    icon: windowIcon,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: initialTheme === "dark" ? "#070b10" : "#eef4f7",
    autoHideMenuBar: true,
    show: !hidden,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    const rendererUrl = new URL(process.env.ELECTRON_RENDERER_URL);
    rendererUrl.searchParams.set("theme", initialTheme);
    win.loadURL(rendererUrl.toString());
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"), {
      query: { theme: initialTheme },
    });
  }

  mainWindow = win;
  win.on("query-session-end", () => {
    notifyRendererShutdown("session-end");
  });
  win.on("session-end", () => {
    notifyRendererShutdown("session-end");
  });
  win.on("close", (event) => {
    if (
      forceQuit ||
      systemShutdownStarted ||
      !appConfig.appSettings?.closeToTray
    ) {
      return;
    }

    event.preventDefault();
    win.hide();
  });
  win.on("closed", () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
  });
}

app.whenReady().then(async () => {
  appConfig = await loadConfig();
  await applyAutostartSettings();
  createTray();

  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      const requestingWindow = BrowserWindow.fromWebContents(webContents);
      callback(requestingWindow === mainWindow && permission === "media");
    },
  );
  ipcMain.handle("install-update", (event, details) =>
    installWindowsUpdate(
      details.url,
      details.version,
      details.sha256,
      details.sha512,
      (progress) => {
        event.sender.send("update-progress", progress);
      },
    ),
  );
  ipcMain.handle("fetch-update-manifest", async (_event, url) => {
    try {
      return { ok: true, text: await fetchUpdateManifest(url) };
    } catch (error) {
      return {
        ok: false,
        error: error?.message || "Update manifest request failed.",
      };
    }
  });
  ipcMain.handle("load-config", () => loadConfig());
  ipcMain.handle("save-config", (_event, config) => saveConfig(config));
  ipcMain.handle("get-config-path", () => getConfigPath());
  ipcMain.on("update-tray-state", (_event, state) => {
    trayState = { ...trayState, ...state };
    updateTrayMenu();
  });
  ipcMain.handle("get-screen-sources", async (event) => {
    const requestingWindow = BrowserWindow.fromWebContents(event.sender);
    if (requestingWindow !== mainWindow) {
      return [];
    }

    const sources = await desktopCapturer.getSources({
      types: ["screen", "window"],
      thumbnailSize: { width: 320, height: 180 },
      fetchWindowIcons: true,
    });
    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      displayId: source.display_id,
      thumbnail: source.thumbnail?.toDataURL() || "",
      appIcon: source.appIcon?.toDataURL?.() || "",
    }));
  });
  ipcMain.handle("write-clipboard", (_event, text) => {
    clipboard.writeText(String(text || ""));
    return { ok: true };
  });
  ipcMain.handle("get-notification-state", () => getAppNotificationState());
  ipcMain.handle("show-app-notification", (_event, details) =>
    showAppNotification(details),
  );
  ipcMain.handle("close-app-notification", (_event, id) =>
    closeAppNotification(id),
  );
  ipcMain.handle("notification-action", (_event, action) => {
    sendNotificationAction(action);
    return { ok: true };
  });
  ipcMain.on("realtime-cleanup-complete", (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win === mainWindow && delayedQuitStarted && systemShutdownStarted) {
      finishDelayedQuit();
    }
  });
  ipcMain.handle("window-control", (event, action) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return { ok: false };
    if (action === "minimize") win.minimize();
    if (action === "maximize") {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
    if (action === "close") win.close();
    return { ok: true, maximized: win.isMaximized() };
  });
  createWindow({ hidden: shouldStartHidden() });

  powerMonitor.on("shutdown", () => {
    notifyRendererShutdown("shutdown");
  });

  app.on("activate", () => {
    showMainWindow();
  });
});

app.on("before-quit", (event) => {
  if (delayedQuitStarted || systemShutdownStarted) {
    return;
  }

  delayedQuitStarted = true;
  notifyRendererShutdown("quit");
  event.preventDefault();
  delayedQuitTimer = setTimeout(finishDelayedQuit, 900);
});

app.on("window-all-closed", () => {
  if (
    forceQuit ||
    systemShutdownStarted ||
    !appConfig.appSettings?.closeToTray
  ) {
    app.quit();
  }
});
