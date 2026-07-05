const {
  app,
  BrowserWindow,
  Menu,
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
const notificationWindows = [];
const notificationWindowById = new Map();
const notificationDetailsById = new Map();
let lastSystemDndCheck = { checkedAt: 0, enabled: false };

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

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
    `${JSON.stringify(normalizedConfig, null, 2)}\n`,
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
  await writeFile(autostartPath, `${desktopEntry}\n`, "utf8");
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

function updateTrayMenu() {
  if (!tray) {
    return;
  }

  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Open",
        click: showMainWindow,
      },
      {
        label: "Close",
        click: () => {
          forceQuit = true;
          app.quit();
        },
      },
    ]),
  );
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

function positionNotificationWindows() {
  const { workArea } = screen.getPrimaryDisplay();
  let y = workArea.y + workArea.height - 12;

  for (const win of [...notificationWindows].reverse()) {
    if (win.isDestroyed()) {
      continue;
    }

    const [width, height] = win.getSize();
    y -= height;
    win.setBounds({
      x: workArea.x + workArea.width - width - 12,
      y,
      width,
      height,
    });
    y -= 10;
  }
}

function closeNotificationWindow(win) {
  const index = notificationWindows.indexOf(win);
  if (index !== -1) {
    notificationWindows.splice(index, 1);
  }
  for (const [id, notificationWindow] of notificationWindowById) {
    if (notificationWindow === win) {
      notificationWindowById.delete(id);
      notificationDetailsById.delete(id);
    }
  }
  if (!win.isDestroyed()) {
    win.close();
  }
  positionNotificationWindows();
}

function closeOtherNotificationWindows(keepId = "") {
  for (const [id, win] of [...notificationWindowById.entries()]) {
    if (id === keepId || win.isDestroyed()) {
      continue;
    }
    closeNotificationWindow(win);
  }
}

function sendNotificationAction(action) {
  if (action?.openWindow) {
    showMainWindow();
  }

  mainWindow?.webContents.send("notification-action", action);
}

function createNotificationHtml(details, soundUrl, logoUrl) {
  const isCall = details.kind === "call";
  const theme = details.theme === "dark" ? "dark" : "light";
  const title = escapeHtml(
    details.title || (isCall ? "Incoming call" : "New message"),
  );
  const body = escapeHtml(details.body || "");
  const peerId = escapeAttribute(details.peerId || "");
  const callId = escapeAttribute(details.callId || "");
  const notificationId = escapeAttribute(details.id || "");
  const sound = escapeAttribute(soundUrl);
  const logo = escapeAttribute(logoUrl);

  return `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: transparent;
      font-family: "Segoe UI", system-ui, sans-serif;
      color: ${theme === "dark" ? "#eefbff" : "#0d2f43"};
      user-select: none;
    }
    .toast {
      width: 100%;
      height: 100%;
      border: 1px solid rgba(255,255,255,.82);
      border-radius: 8px;
      padding: 7px;
      background:
        ${
          theme === "dark"
            ? "linear-gradient(145deg, rgba(13,22,30,.98), rgba(6,12,18,.98)), radial-gradient(circle at 14% 0%, rgba(72,158,184,.12), transparent 8rem)"
            : "linear-gradient(145deg, rgba(251,255,255,.97), rgba(179,239,252,.95)), radial-gradient(circle at 14% 0%, rgba(255,255,255,.86), transparent 8rem)"
        };
      box-shadow: ${theme === "dark" ? "0 16px 34px rgba(0,0,0,.54), inset 0 1px 0 rgba(255,255,255,.08)" : "0 16px 34px rgba(3, 43, 68, .28), inset 0 1px 0 rgba(255,255,255,.9)"};
      animation: enter 170ms cubic-bezier(.2,.82,.2,1);
    }
    header {
      display: grid;
      grid-template-columns: 30px minmax(0,1fr) 24px;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .icon {
      display: grid;
      place-items: center;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: ${theme === "dark" ? "linear-gradient(#253947, #122532 48%, #07131c)" : "linear-gradient(#ffffff, #9cf1ff 48%, #34b7e7)"};
      color: ${theme === "dark" ? "#e7fbff" : "#09536c"};
      font-size: 10px;
      font-weight: 900;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.82), 0 5px 10px rgba(0,104,148,.12);
    }
    .icon img {
      width: 24px;
      height: 24px;
      object-fit: contain;
      border-radius: 50%;
    }
    strong, p {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    strong {
      display: block;
      font-size: 12px;
      line-height: 1.15;
      white-space: nowrap;
    }
    p {
      margin: 2px 0 0;
      color: ${theme === "dark" ? "#a9c7d1" : "#315f72"};
      font-size: 11px;
      line-height: 1.25;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .close {
      display: grid;
      place-items: center;
      width: 24px;
      height: 24px;
      border: 0;
      border-radius: 5px;
      background: ${theme === "dark" ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.45)"};
      color: ${theme === "dark" ? "#cfe7ee" : "#456b7c"};
      font-weight: 900;
      cursor: pointer;
    }
    .actions {
      display: grid;
      grid-template-columns: ${isCall ? "1fr 1fr" : "minmax(0, 1fr) auto"};
      gap: 6px;
    }
    input {
      min-width: 0;
      height: 27px;
      border: 1px solid ${theme === "dark" ? "rgba(130,179,194,.24)" : "rgba(68,151,181,.35)"};
      border-radius: 5px;
      padding: 0 8px;
      outline: none;
      background: ${theme === "dark" ? "rgba(2,9,14,.82)" : "rgba(255,255,255,.84)"};
      color: ${theme === "dark" ? "#eefbff" : "#0c3143"};
      font-size: 12px;
      box-shadow: inset 0 2px 5px rgba(18,102,133,.08);
    }
    button.action {
      height: 28px;
      border: 1px solid rgba(0,117,157,.25);
      border-radius: 5px;
      padding: 0 9px;
      background: ${theme === "dark" ? "linear-gradient(#2d4654, #183240 48%, #0b1d28)" : "linear-gradient(#fbffff, #9cf1ff 48%, #34b7e7 49%, #0f93c8)"};
      color: ${theme === "dark" ? "#f0fbff" : "#05384f"};
      font-size: 11px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.82), 0 5px 10px rgba(0,104,148,.1);
    }
    button.accept { color: ${theme === "dark" ? "#a8f2ce" : "#11613d"}; }
    button.decline {
      background: ${theme === "dark" ? "linear-gradient(#55212c, #36111a 48%, #200910)" : "linear-gradient(#ffffff, #ffe7eb 48%, #ffb3c0)"};
      color: ${theme === "dark" ? "#ffdce4" : "#7b2534"};
    }
    @keyframes enter {
      from { opacity: 0; transform: translateX(18px) scale(.98); }
      to { opacity: 1; transform: translateX(0) scale(1); }
    }
  </style>
</head>
<body data-kind="${escapeAttribute(details.kind)}" data-peer-id="${peerId}" data-call-id="${callId}" data-id="${notificationId}">
  <section class="toast" id="toast">
    <header>
      <div class="icon">${logo ? `<img src="${logo}" alt="" />` : "A"}</div>
      <div>
        <strong>${title}</strong>
        <p>${body}</p>
      </div>
      <button class="close" type="button" id="close" aria-label="Close">×</button>
    </header>
    <div class="actions">
      ${
        isCall
          ? `
        <button class="action accept" type="button" id="accept">Accept</button>
        <button class="action decline" type="button" id="decline">Decline</button>
      `
          : `
        <input id="reply" type="text" maxlength="4000" placeholder="Reply..." />
        <button class="action" type="button" id="send">Send</button>
      `
      }
    </div>
  </section>
  ${sound ? `<audio id="sound" src="${sound}" ${isCall ? "" : "autoplay"}></audio>` : ""}
  <script>
    const body = document.body;
    const base = {
      id: body.dataset.id,
      kind: body.dataset.kind,
      peerId: body.dataset.peerId,
      callId: body.dataset.callId
    };
    function close() {
      window.aeroChatNotification.close(base.id);
    }
    async function action(type, extra = {}) {
      await window.aeroChatNotification.action({ ...base, type, ...extra }).catch(() => {});
      close();
    }
    document.getElementById("close").addEventListener("click", close);
    document.getElementById("toast").addEventListener("click", (event) => {
      if (event.target.closest("button") || event.target.closest("input")) return;
      action("open", { openWindow: true });
    });
    const reply = document.getElementById("reply");
    const send = document.getElementById("send");
    if (reply && send) {
      send.addEventListener("click", () => {
        const text = reply.value.trim();
        if (text) action("reply", { text, openWindow: false });
      });
      reply.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          send.click();
        }
      });
      setTimeout(() => reply.focus(), 70);
    }
    document.getElementById("accept")?.addEventListener("click", () => action("accept-call", { openWindow: true }));
    document.getElementById("decline")?.addEventListener("click", () => action("decline-call"));
    const sound = document.getElementById("sound");
    let ringtoneAudioContext = null;
    let ringtoneSource = null;
    async function playSound() {
      if (!sound) return;
      sound.volume = 1;
      sound.currentTime = 0;
      if (base.kind !== "call") {
        await sound.play().catch(() => {});
        return;
      }

      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        ringtoneAudioContext = new AudioContextClass();
        const response = await fetch(sound.src);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ringtoneAudioContext.decodeAudioData(arrayBuffer);
        ringtoneSource = ringtoneAudioContext.createBufferSource();
        ringtoneSource.buffer = audioBuffer;
        ringtoneSource.loop = true;
        ringtoneSource.connect(ringtoneAudioContext.destination);
        ringtoneSource.start(0);
        sound.pause();
      } catch {
        sound.loop = true;
        await sound.play().catch(() => {});
      }
    }
    function stopSound() {
      try {
        ringtoneSource?.stop();
      } catch {}
      ringtoneSource = null;
      ringtoneAudioContext?.close().catch(() => {});
      ringtoneAudioContext = null;
      if (sound) {
        sound.pause();
        sound.currentTime = 0;
      }
    }
    window.addEventListener("beforeunload", stopSound);
    playSound();
  </script>
</body>
</html>`;
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
  const notification = {
    id:
      details.id ||
      `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    kind,
    peerId: details.peerId || "",
    callId: details.callId || "",
    title: String(details.title || ""),
    body: String(details.body || ""),
    theme: details.theme === "dark" ? "dark" : "light",
  };
  const existingWindow = notificationWindowById.get(notification.id);
  if (existingWindow && !existingWindow.isDestroyed()) {
    positionNotificationWindows();
    return { ok: true, id: notification.id, existing: true };
  }

  closeOtherNotificationWindows(notification.id);

  const width = 342;
  const height = kind === "call" ? 88 : 118;
  const win = new BrowserWindow({
    width,
    height,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  notificationWindows.push(win);
  notificationWindowById.set(notification.id, win);
  notificationDetailsById.set(notification.id, notification);
  win.on("closed", () => {
    const index = notificationWindows.indexOf(win);
    if (index !== -1) {
      notificationWindows.splice(index, 1);
    }
    notificationWindowById.delete(notification.id);
    notificationDetailsById.delete(notification.id);
    positionNotificationWindows();
  });

  const hasOtherCallNotification = Array.from(
    notificationDetailsById.entries(),
  ).some(([id, item]) => {
    const notificationWindow = notificationWindowById.get(id);
    return (
      id !== notification.id &&
      item.kind === "call" &&
      notificationWindow &&
      !notificationWindow.isDestroyed()
    );
  });
  const shouldPlaySound =
    !details.silent &&
    !isSystemDoNotDisturbEnabled() &&
    (kind !== "call" || !hasOtherCallNotification);
  const soundUrl = shouldPlaySound
    ? findNotificationSound(kind === "call" ? "ringtone" : "message")
    : "";
  const logoUrl = findNotificationLogo();
  win.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(createNotificationHtml(notification, soundUrl, logoUrl))}`,
  );
  win.once("ready-to-show", () => {
    positionNotificationWindows();
    win.show();
    if (kind === "message") {
      setTimeout(() => closeNotificationWindow(win), 12000);
    }
  });

  return { ok: true, id: notification.id };
}

function closeAppNotification(id) {
  const win = notificationWindowById.get(String(id));
  if (win) {
    closeNotificationWindow(win);
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
    projectConfig.release.windowsInstallerAsset,
    projectConfig.release.windowsX64SetupAsset,
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
