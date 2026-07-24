const {
  app,
  BrowserWindow,
  Menu,
  nativeImage,
  Notification,
  Tray,
  clipboard,
  desktopCapturer,
  ipcMain,
  powerMonitor,
  safeStorage,
  shell,
  session,
  screen,
} = require("electron");
const { createWriteStream, readFileSync } = require("node:fs");
const {
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} = require("node:fs/promises");
const {
  createHash,
  randomBytes,
} = require("node:crypto");
const { get } = require("node:https");
const { tmpdir } = require("node:os");
const { basename, dirname, join } = require("node:path");
const { execFileSync, spawn } = require("node:child_process");
const {
  KEY_BYTES,
  decryptAuthenticatedConfig,
  decryptLegacyConfig,
  encryptAuthenticatedConfig,
  isAuthenticatedConfig,
} = require("./config-crypto");
const projectConfig = __PROJECT_CONFIG__;

const packagedWindowIconPath = join(
  process.resourcesPath,
  process.platform === "win32" ? "app-icon.ico" : "app-icon.png",
);
const bundledWindowIconPath =
  process.platform === "win32"
    ? join(__dirname, "../../assets/app.ico")
    : join(__dirname, "../../assets/linux-icons/512x512.png");
let windowIconPath = app.isPackaged
  ? packagedWindowIconPath
  : bundledWindowIconPath;
let windowIcon = nativeImage.createFromPath(windowIconPath);
if (windowIcon.isEmpty() && windowIconPath !== bundledWindowIconPath) {
  windowIconPath = bundledWindowIconPath;
  windowIcon = nativeImage.createFromPath(windowIconPath);
}
const releaseHost = "github.com";
const releasePathPrefix = `/${projectConfig.repo}/releases/`;
const latestManifestUrl = `https://${releaseHost}${releasePathPrefix}latest/download/latest.yml`;
const changelogFeedUrl =
  "https://zorblock.featurebase.app/api/v1/changelog/feed.rss";
const appDisplayName = projectConfig.app.name;
const userConfigFileName = "config.aero";
const userConfigKeyFileName = "config.key";
const updateManifestTimeoutMs = 12000;
const updateManifestRetryDelayMs = 800;
const updateDownloadTimeoutMs = 60000;
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
let toastWindow = null;
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
// Keep the runtime window identity aligned with the installed launcher.
if (process.platform === "win32") {
  app.setAppUserModelId(projectConfig.app.id);
}
if (process.platform === "linux") {
  app.commandLine.appendSwitch("class", projectConfig.app.id);
}

if (process.env.AERO_CHAT_USER_DATA_DIR) {
  app.setPath("userData", process.env.AERO_CHAT_USER_DATA_DIR);
} else if (!app.isPackaged) {
  app.setPath("userData", join(process.cwd(), ".dev-data", "instance-0"));
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

function getConfigBackupPath() {
  return `${getConfigPath()}.bak`;
}

function getConfigKeyPath() {
  return join(app.getPath("userData"), userConfigKeyFileName);
}

function getConfigKeyBackupPath() {
  return `${getConfigKeyPath()}.bak`;
}

function getDefaultAppSettings() {
  return {
    welcomeScreen: true,
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
    ...settings,
    // Missing means setup has never been completed. This also onboards
    // existing installations once when they first receive this setting.
    welcomeScreen: settings.welcomeScreen !== false,
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
    ...audio,
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

let cachedConfigKey = null;

function decodeStoredConfigKey(value) {
  const text = String(value).trim();
  let decoded;
  if (text.startsWith("SAFE:")) {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("Operating-system secret storage is unavailable.");
    }
    decoded = Buffer.from(
      safeStorage.decryptString(Buffer.from(text.substring(5), "base64")),
      "base64",
    );
  } else if (text.startsWith("LOCAL:")) {
    decoded = Buffer.from(text.substring(6), "base64");
  } else {
    throw new Error("Invalid config key format.");
  }

  if (decoded.length !== KEY_BYTES) {
    throw new Error("Invalid config key length.");
  }
  return decoded;
}

async function readExistingConfigKey() {
  if (cachedConfigKey) {
    return cachedConfigKey;
  }

  const keyPaths = [getConfigKeyPath(), getConfigKeyBackupPath()];
  let lastError = null;
  for (const keyPath of keyPaths) {
    try {
      cachedConfigKey = decodeStoredConfigKey(
        await readFile(keyPath, "utf8"),
      );
      return cachedConfigKey;
    } catch (error) {
      if (error.code !== "ENOENT") {
        lastError = error;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }
  return null;
}

async function createConfigKey() {
  const existing = await readExistingConfigKey();
  if (existing) {
    return existing;
  }

  const key = randomBytes(KEY_BYTES);
  const protectedValue = safeStorage.isEncryptionAvailable()
    ? `SAFE:${safeStorage.encryptString(key.toString("base64")).toString("base64")}`
    : `LOCAL:${key.toString("base64")}`;
  const keyPath = getConfigKeyPath();
  const keyBackupPath = getConfigKeyBackupPath();
  const tempPath = `${keyPath}.${process.pid}.tmp`;

  await mkdir(app.getPath("userData"), { recursive: true });
  await writeFile(tempPath, protectedValue, { encoding: "utf8", mode: 0o600 });
  await rename(tempPath, keyPath);
  await chmod(keyPath, 0o600).catch(() => {});
  await copyFile(keyPath, keyBackupPath);
  await chmod(keyBackupPath, 0o600).catch(() => {});
  cachedConfigKey = key;
  return key;
}

function legacyConfigPaths() {
  const installDir = dirname(process.execPath);
  return [
    join(installDir, userConfigFileName),
    join(installDir, `${userConfigFileName}.bak`),
    join(installDir, "config.json"),
    join(app.getPath("appData"), app.name, "config.json"),
    join(app.getPath("appData"), "aero-p2p-chat", "config.json"),
  ];
}

async function removeMigratedLegacyConfigs() {
  const protectedPaths = new Set([getConfigPath(), getConfigBackupPath()]);
  for (const legacyPath of new Set(legacyConfigPaths())) {
    if (!protectedPaths.has(legacyPath)) {
      await rm(legacyPath, { force: true }).catch(() => {});
    }
  }
}

function prepareLegacyConfigMigration(config) {
  if (!config || typeof config !== "object") {
    return config;
  }

  const legacyIdentity =
    config.identity && typeof config.identity === "object"
      ? config.identity
      : null;
  const legacyToken =
    typeof legacyIdentity?.authToken === "string"
      ? legacyIdentity.authToken.trim()
      : "";
  const legacyUserId =
    typeof legacyIdentity?.accountUserId === "string"
      ? legacyIdentity.accountUserId.trim()
      : "";

  if (legacyToken && legacyUserId) {
    config.security = {
      ...(config.security && typeof config.security === "object"
        ? config.security
        : {}),
      pendingTokenRevocation: {
        userId: legacyUserId,
        token: legacyToken,
      },
      accountReloginRequired: true,
    };
  }

  if (legacyIdentity) {
    legacyIdentity.loggedIn = false;
    legacyIdentity.accountUserId = "";
    legacyIdentity.authToken = "";
    legacyIdentity.role = "";
  }
  return config;
}

async function loadConfig() {
  const configPaths = [
    getConfigPath(),
    getConfigBackupPath(),
    ...legacyConfigPaths(),
  ];
  let lastError = null;
  for (const configPath of configPaths) {
    try {
      const fileData = await readFile(configPath, "utf8");
      const authenticated = isAuthenticatedConfig(fileData);
      const existingKey = await readExistingConfigKey();
      const isProtectedConfigPath =
        configPath === getConfigPath() || configPath === getConfigBackupPath();
      if (
        !authenticated &&
        app.isPackaged &&
        (isProtectedConfigPath || existingKey)
      ) {
        throw new Error("Refused unauthenticated config after security migration.");
      }
      const plaintext = authenticated
        ? decryptAuthenticatedConfig(fileData, existingKey)
        : decryptLegacyConfig(
            fileData,
            projectConfig.app.id || "AeroP2Pchat",
          );
      const parsedConfig = JSON.parse(plaintext);
      const config = normalizeConfig(
        authenticated
          ? parsedConfig
          : prepareLegacyConfigMigration(parsedConfig),
      );
      if (!authenticated || configPath !== getConfigPath()) {
        await saveConfig(config);
        if (configPath === getConfigBackupPath()) {
          await copyFile(getConfigPath(), getConfigBackupPath());
        }
        await removeMigratedLegacyConfigs();
      }
      return config;
    } catch (error) {
      if (error.code !== "ENOENT") {
        lastError = error;
        console.warn(
          `Could not read saved settings from ${configPath}; trying backup.`,
          error.message,
        );
      }
    }
  }
  // Keep a damaged file in place for recovery instead of replacing it with an
  // empty config. A later save will recreate the primary file atomically.
  if (lastError) {
    console.warn("No readable settings file found; starting with defaults.");
  }
  return normalizeConfig({});
}

async function saveConfig(config) {
  const normalizedConfig = normalizeConfig(config || {});
  const configPath = getConfigPath();
  const backupPath = getConfigBackupPath();
  const tempPath = `${configPath}.${process.pid}.tmp`;
  await mkdir(app.getPath("userData"), { recursive: true });
  const dataString = encryptAuthenticatedConfig(
    JSON.stringify(normalizedConfig, null, 2),
    await createConfigKey(),
  );
  await writeFile(tempPath, dataString, "utf8");
  let hadExistingConfig = false;
  try {
    await copyFile(configPath, backupPath);
    hadExistingConfig = true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await rename(tempPath, configPath);
  if (!hadExistingConfig) {
    await copyFile(configPath, backupPath);
  }
  appConfig = normalizedConfig;
  await applyAutostartSettings();
  return { ok: true, path: configPath };
}

function getAutostartArgs() {
  return appConfig.appSettings?.startHidden ? ["--hidden"] : [];
}

function getLinuxAutostartPath() {
  const configHome =
    process.env.XDG_CONFIG_HOME || join(app.getPath("home"), ".config");
  return join(configHome, "autostart", autostartDesktopFileName);
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
  if (!app.isPackaged && process.env.AERO_CHAT_APPLY_DEV_AUTOSTART !== "1") {
    return;
  }

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
  debugOfflineMode: false,
  debugSimulateUpdate: false,
};

function hasTrayStateChanged(nextState) {
  return [
    "peerId",
    "isMuted",
    "isDeafened",
    "status",
    "theme",
    "autostart",
    "closeToTray",
    "debugOfflineMode",
    "debugSimulateUpdate",
  ].some((key) => trayState[key] !== nextState[key]);
}

function updateTrayMenu() {
  if (!tray) {
    return;
  }

  const menuIcon = windowIcon.resize({ width: 16, height: 16 });

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
        {
          label: "Online",
          type: "radio",
          checked: trayState.status === "online",
          click: () => sendTrayAction("set-status", "online"),
        },
        {
          label: "Do Not Disturb",
          type: "radio",
          checked: trayState.status === "dnd",
          click: () => sendTrayAction("set-status", "dnd"),
        },
        {
          label: "Offline / Hidden",
          type: "radio",
          checked: trayState.status === "offline",
          click: () => sendTrayAction("set-status", "offline"),
        },
      ],
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
        {
          label: "Dark Mode",
          type: "checkbox",
          checked: trayState.theme === "dark",
          click: () => sendTrayAction("toggle-theme"),
        },
        {
          label: "Launch on Startup",
          type: "checkbox",
          checked: trayState.autostart,
          click: () => sendTrayAction("toggle-autostart"),
        },
        {
          label: "Close to Tray",
          type: "checkbox",
          checked: trayState.closeToTray,
          click: () => sendTrayAction("toggle-close-to-tray"),
        },
      ],
    },
    { type: "separator" },
    {
      label: "Open Aero P2P Chat",
      click: showMainWindow,
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

  menuTemplate.splice(-2, 0, {
    label: "Check for Updates",
    click: () => sendTrayAction("check-for-updates"),
  });

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
            label: "Offline Mode",
            type: "checkbox",
            checked: trayState.debugOfflineMode,
            click: () => {
              trayState.debugOfflineMode = !trayState.debugOfflineMode;
              updateTrayMenu();
              sendTrayAction(
                "set-debug-offline-mode",
                trayState.debugOfflineMode,
              );
            },
          },
          {
            label: "Simulate Update",
            type: "checkbox",
            checked: trayState.debugSimulateUpdate,
            click: () => {
              trayState.debugSimulateUpdate = !trayState.debugSimulateUpdate;
              updateTrayMenu();
              sendTrayAction(
                "set-debug-simulate-update",
                trayState.debugSimulateUpdate,
              );
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

function createToastWindow() {
  if (toastWindow) return toastWindow;

  const display = screen.getPrimaryDisplay();
  const workArea = display.workArea;

  toastWindow = new BrowserWindow({
    width: 380,
    height: 10,
    x: workArea.x + workArea.width - 380 - 10,
    y: workArea.y + workArea.height - 10,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  toastWindow.setIgnoreMouseEvents(false);

  if (process.env.ELECTRON_RENDERER_URL) {
    const toastUrl = new URL("toast.html", process.env.ELECTRON_RENDERER_URL);
    toastWindow.loadURL(toastUrl.toString());
  } else {
    toastWindow.loadFile(join(__dirname, "../renderer/toast.html"));
  }

  toastWindow.on("closed", () => {
    toastWindow = null;
  });

  return toastWindow;
}

function sendNotificationAction(action) {
  if (action?.openWindow) {
    showMainWindow();
  }
  mainWindow?.webContents.send("notification-action", action);
}

function showAppNotification(details = {}) {
  if (
    shouldSuppressNotification({
      showWhenFocused: Boolean(details.showWhenFocused),
    })
  ) {
    return { ok: true, suppressed: true };
  }

  const kind = details.kind === "call" ? "call" : "message";
  const notificationId =
    details.id || `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  if (activeNotifications.has(notificationId)) {
    return { ok: true, id: notificationId, existing: true };
  }

  const title = String(
    details.title || (kind === "call" ? "Incoming call" : "New message"),
  );
  const body = String(details.body || "");
  const peerId = details.peerId || "";
  const callId = details.callId || "";

  const toastPayload = {
    id: notificationId,
    title,
    body,
    kind,
    peerId,
    accountUserId: details.accountUserId,
    callId,
    theme: details.theme,
    silent: Boolean(details.silent),
    avatarCacheBuster:
      details.avatarCacheBuster || Math.floor(Date.now() / 3600000),
  };

  activeNotifications.set(notificationId, true);

  if (!toastWindow) {
    createToastWindow();
    toastWindow.once("ready-to-show", () => {
      toastWindow.showInactive();
      toastWindow.webContents.send("show-toast", toastPayload);
    });
  } else {
    toastWindow.showInactive();
    toastWindow.webContents.send("show-toast", toastPayload);
  }

  // The renderer (toast.js) will handle the 10s auto-close and send close-app-notification.
  return { ok: true, id: notificationId };
}

function closeAppNotification(id) {
  if (activeNotifications.has(String(id))) {
    activeNotifications.delete(String(id));
    if (toastWindow) {
      toastWindow.webContents.send("close-toast", String(id));
    }
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

function fetchUpdateManifest(rawUrl) {
  const url = assertTrustedManifestUrl(rawUrl);
  return fetchTextWithRetry(url);
}

function fetchChangelogFeed() {
  return fetchTextWithRetry(new URL(changelogFeedUrl));
}

function downloadFile(url, targetPath, onProgress = () => {}, redirects = 0) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let responseStream = null;
    let file = null;

    const fail = (error) => {
      if (settled) {
        return;
      }
      settled = true;
      request.destroy();
      responseStream?.destroy();
      file?.destroy();
      rm(targetPath, { force: true })
        .catch(() => {})
        .finally(() => reject(error));
    };

    const request = get(url, (response) => {
      responseStream = response;
      if (
        [301, 302, 303, 307, 308].includes(response.statusCode) &&
        response.headers.location
      ) {
        response.resume();
        if (redirects >= 5) {
          reject(new Error("Too many update download redirects."));
          return;
        }

        settled = true;
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

      file = createWriteStream(targetPath);
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
        if (totalBytes > 0 && receivedBytes !== totalBytes) {
          fail(new Error("Update download ended before all bytes arrived."));
          return;
        }

        file.close((error) => {
          if (error) {
            fail(error);
            return;
          }
          settled = true;
          onProgress({
            phase: "download",
            percent: 100,
            receivedBytes: totalBytes || receivedBytes,
            totalBytes: totalBytes || receivedBytes,
          });
          resolve();
        });
      });
      file.on("error", fail);
      response.on("aborted", () =>
        fail(new Error("Update download was interrupted.")),
      );
      response.on("error", fail);
    });

    request.on("error", fail);
    request.setTimeout(updateDownloadTimeoutMs, () => {
      fail(new Error("Update download timed out."));
    });
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

  try {
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
    let updater;
    let spawnError;
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      try {
        updater = spawn(setupPath, setupArgs, {
          detached: true,
          stdio: "ignore",
          windowsHide: false,
        });
        break;
      } catch (error) {
        spawnError = error;
        if (attempt < 10) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    if (!updater) {
      throw spawnError || new Error("Could not spawn updater process.");
    }

    updater.unref();

    setTimeout(() => {
      forceQuit = true;
      app.quit();
    }, 250);
    return { ok: true };
  } catch (error) {
    await rm(updateDir, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

function createWindow({ hidden = false } = {}) {
  const initialTheme =
    appConfig?.appSettings?.theme === "dark" ? "dark" : "light";
  const win = new BrowserWindow({
    width: 980,
    height: 680,
    minWidth: 620,
    minHeight: 440,
    title: appDisplayName,
    icon: windowIcon,
    frame: false,
    thickFrame: true,
    backgroundMaterial: "none",
    transparent: false,
    titleBarStyle: "hidden",
    backgroundColor: initialTheme === "dark" ? "#000000" : "#eef4f7",
    autoHideMenuBar: true,
    show: !hidden,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  // Apply the icon after native window creation as well. On Windows this also
  // sets the taskbar button identity and relaunch icon instead of inheriting
  // electron.exe's defaults during development or from an old shortcut.
  win.setIcon(windowIcon);
  if (process.platform === "win32") {
    win.setAppDetails({
      appId: projectConfig.app.id,
      appIconPath: windowIconPath,
      appIconIndex: 0,
    });
  }

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

  ipcMain.handle("fetch-changelog-feed", async () => {
    try {
      return { ok: true, text: await fetchChangelogFeed() };
    } catch (error) {
      return {
        ok: false,
        error: error?.message || "Changelog request failed.",
      };
    }
  });
  ipcMain.handle("load-config", () => loadConfig());
  ipcMain.handle("save-config", (_event, config) => saveConfig(config));
  ipcMain.handle("get-config-path", () => getConfigPath());
  ipcMain.on("update-tray-state", (_event, state) => {
    const nextTrayState = { ...trayState, ...state };
    // The renderer synchronizes every 1.5 seconds. Replacing an open native
    // tray menu with an identical menu closes its submenus on Linux, so only
    // rebuild when an item the user can see has actually changed.
    if (!hasTrayStateChanged(nextTrayState)) {
      return;
    }

    trayState = nextTrayState;
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
  ipcMain.on("update-toast-height", (event, height) => {
    if (toastWindow && !toastWindow.isDestroyed()) {
      const display = screen.getPrimaryDisplay();
      const workArea = display.workArea;
      // We set height to height or minimum 10 so it's not totally 0.
      const h = Math.max(10, height);
      toastWindow.setBounds({
        x: workArea.x + workArea.width - 380 - 10,
        y: workArea.y + workArea.height - h - 10,
        width: 380,
        height: h,
      });
      // Hide if empty
      if (height <= 0) {
        toastWindow.hide();
      } else {
        toastWindow.showInactive();
      }
    }
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
  ipcMain.on("console-log", (event, msg) => {
    console.log("[Renderer Log]:", msg);
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
