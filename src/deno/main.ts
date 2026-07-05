import projectConfig from "../../config.json" with { type: "json" };
import packageInfo from "../../package.json" with { type: "json" };

type AppConfig = Record<string, unknown> & {
  appSettings?: {
    autostart?: boolean;
    startHidden?: boolean;
    closeToTray?: boolean;
    readReceipts?: boolean;
    sidebarWidth?: number;
    theme?: string;
    presenceStatus?: string;
  };
  audio?: Record<string, unknown>;
};

type BrowserWindowLike = {
  bind: (name: string, handler: (...args: unknown[]) => unknown) => void;
  show: () => void;
  hide: () => void;
  focus: () => void;
  close: () => void;
  isVisible?: () => boolean;
  setTitle?: (title: string) => void;
  setApplicationMenu?: (items: unknown[]) => void;
  addEventListener?: (type: string, listener: (event: Event) => void) => void;
};

type TrayLike = {
  setIcon?: (bytes: Uint8Array) => void | Promise<void>;
  setToolTip?: (text: string) => void;
  setMenu?: (items: unknown[]) => void;
  setContextMenu?: (items: unknown[]) => void;
  addEventListener?: (type: string, listener: () => void) => void;
  onclick?: () => void;
};

const appDisplayName = projectConfig.app.name;
const appIdentifier = projectConfig.app.id;
const userConfigFileName = "config.json";
const defaultSidebarWidth = 230;
const minSidebarWidth = 170;
const maxSidebarWidth = 360;
const releaseBaseUrl = `${projectConfig.pagesBaseUrl}/releases`;
const rendererDist = new URL("../../dist/renderer/", import.meta.url);
const publicDir = new URL("../../public/", import.meta.url);
const assetsDir = new URL("../../assets/", import.meta.url);
const eventQueue: Array<{ type: string; payload?: unknown }> = [];

let appConfig: AppConfig = {};
let mainWindow: BrowserWindowLike | null = null;
let tray: TrayLike | null = null;
let forceQuit = false;

function platform() {
  if (Deno.build.os === "windows") return "win32";
  if (Deno.build.os === "darwin") return "darwin";
  return "linux";
}

function joinPath(...parts: string[]) {
  const separator = Deno.build.os === "windows" ? "\\" : "/";
  return parts.filter(Boolean).join(separator).replace(/[\\/]+/g, separator);
}

function getHomeDir() {
  return Deno.env.get("HOME") || Deno.env.get("USERPROFILE") || Deno.cwd();
}

function getUserDataDir() {
  const override = Deno.env.get("AERO_CHAT_USER_DATA_DIR");
  if (override) return override;

  if (Deno.build.os === "windows") {
    return joinPath(
      Deno.env.get("APPDATA") || joinPath(getHomeDir(), "AppData", "Roaming"),
      projectConfig.app.packageName,
    );
  }

  if (Deno.build.os === "darwin") {
    return joinPath(
      getHomeDir(),
      "Library",
      "Application Support",
      projectConfig.app.packageName,
    );
  }

  return joinPath(
    Deno.env.get("XDG_CONFIG_HOME") || joinPath(getHomeDir(), ".config"),
    projectConfig.app.packageName,
  );
}

function getConfigPath() {
  return joinPath(getUserDataDir(), userConfigFileName);
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
    micSensitivity: 55,
    micBoost: 100,
    micNoiseReduction: 55,
    micEqLow: 0,
    micEqMid: 0,
    micEqHigh: 0,
    micProfile: "voice-isolation",
  };
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  return Number.isFinite(value)
    ? Math.round(Math.max(min, Math.min(max, Number(value))))
    : fallback;
}

function normalizeConfig(config: AppConfig = {}) {
  const settings = {
    ...getDefaultAppSettings(),
    ...(config.appSettings && typeof config.appSettings === "object"
      ? config.appSettings
      : {}),
  };
  const audio = {
    ...getDefaultAudioSettings(),
    ...(config.audio && typeof config.audio === "object" ? config.audio : {}),
  };

  config.appSettings = {
    autostart: Boolean(settings.autostart),
    startHidden: Boolean(settings.startHidden),
    closeToTray: settings.closeToTray !== false,
    readReceipts: settings.readReceipts !== false,
    presenceStatus: ["online", "dnd", "offline"].includes(
        String(settings.presenceStatus),
      )
      ? String(settings.presenceStatus)
      : "online",
    theme: ["light", "dark"].includes(String(settings.theme))
      ? String(settings.theme)
      : "light",
    sidebarWidth: clampNumber(
      settings.sidebarWidth,
      defaultSidebarWidth,
      minSidebarWidth,
      maxSidebarWidth,
    ),
  };

  if (!config.appSettings.autostart) {
    config.appSettings.startHidden = false;
  }

  config.audio = {
    inputDeviceId: typeof audio.inputDeviceId === "string"
      ? audio.inputDeviceId
      : "default",
    cameraDeviceId: typeof audio.cameraDeviceId === "string"
      ? audio.cameraDeviceId
      : "default",
    outputDeviceId: typeof audio.outputDeviceId === "string"
      ? audio.outputDeviceId
      : "default",
    remoteVolume: clampNumber(audio.remoteVolume, 100, 0, 100),
    micMode: audio.micMode === "manual" ? "manual" : "auto",
    micSensitivity: clampNumber(audio.micSensitivity, 55, 0, 100),
    micBoost: clampNumber(audio.micBoost, 100, 0, 200),
    micNoiseReduction: clampNumber(audio.micNoiseReduction, 55, 0, 100),
    micEqLow: clampNumber(audio.micEqLow, 0, -12, 12),
    micEqMid: clampNumber(audio.micEqMid, 0, -12, 12),
    micEqHigh: clampNumber(audio.micEqHigh, 0, -12, 12),
    micProfile: ["voice-isolation", "studio", "custom"].includes(
        String(audio.micProfile),
      )
      ? String(audio.micProfile)
      : "voice-isolation",
  };

  return config;
}

async function loadConfig() {
  try {
    return normalizeConfig(JSON.parse(await Deno.readTextFile(getConfigPath())));
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return normalizeConfig({});
    }
    throw error;
  }
}

async function saveConfig(config: AppConfig) {
  const normalized = normalizeConfig(config || {});
  await Deno.mkdir(getUserDataDir(), { recursive: true });
  await Deno.writeTextFile(
    getConfigPath(),
    `${JSON.stringify(normalized, null, 2)}\n`,
  );
  appConfig = normalized;
  await applyAutostartSettings();
  return { ok: true, path: getConfigPath() };
}

function getExecutablePath() {
  return Deno.execPath();
}

function getAutostartArgs() {
  return appConfig.appSettings?.startHidden ? ["--hidden"] : [];
}

function quoteDesktopValue(value: string) {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

async function applyLinuxAutostartSettings() {
  const autostartPath = joinPath(
    getHomeDir(),
    ".config",
    "autostart",
    projectConfig.linux.autostartDesktopFileName,
  );

  if (!appConfig.appSettings?.autostart) {
    await Deno.remove(autostartPath).catch(() => {});
    return;
  }

  const executable = Deno.env.get("APPIMAGE") || getExecutablePath();
  const args = getAutostartArgs().map(quoteDesktopValue).join(" ");
  const desktopEntry = [
    "[Desktop Entry]",
    "Type=Application",
    `Name=${appDisplayName}`,
    `Exec=${quoteDesktopValue(executable)}${args ? ` ${args}` : ""}`,
    "Terminal=false",
    "X-GNOME-Autostart-enabled=true",
  ].join("\n");

  await Deno.mkdir(joinPath(getHomeDir(), ".config", "autostart"), {
    recursive: true,
  });
  await Deno.writeTextFile(autostartPath, `${desktopEntry}\n`);
}

async function applyWindowsAutostartSettings() {
  const key =
    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run";
  if (!appConfig.appSettings?.autostart) {
    await new Deno.Command("reg.exe", {
      args: ["delete", key, "/v", appDisplayName, "/f"],
      stdout: "null",
      stderr: "null",
    }).output().catch(() => {});
    return;
  }

  const command = [
    quoteDesktopValue(getExecutablePath()),
    ...getAutostartArgs().map(quoteDesktopValue),
  ].join(" ");
  await new Deno.Command("reg.exe", {
    args: ["add", key, "/v", appDisplayName, "/t", "REG_SZ", "/d", command, "/f"],
    stdout: "null",
    stderr: "null",
  }).output().catch(() => {});
}

async function applyAutostartSettings() {
  if (Deno.build.os === "linux") {
    await applyLinuxAutostartSettings();
  } else if (Deno.build.os === "windows") {
    await applyWindowsAutostartSettings();
  }
}

function queueEvent(type: string, payload?: unknown) {
  eventQueue.push({ type, payload });
}

function getMimeType(pathname: string) {
  const lower = pathname.toLowerCase();
  if (lower.endsWith(".html")) return "text/html; charset=utf-8";
  if (lower.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (lower.endsWith(".css")) return "text/css; charset=utf-8";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".ico")) return "image/x-icon";
  if (lower.endsWith(".ogg")) return "audio/ogg";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".woff2")) return "font/woff2";
  return "application/octet-stream";
}

async function fileResponse(url: URL, base: URL) {
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const normalizedPath = pathname.replace(/^\/+/, "");
  const target = new URL(normalizedPath, base);
  try {
    const body = await Deno.readFile(target);
    return new Response(body, {
      headers: { "content-type": getMimeType(target.pathname) },
    });
  } catch (error) {
    if (error instanceof Deno.errors.NotFound && base.href !== publicDir.href) {
      return fileResponse(url, publicDir);
    }
    return new Response("Not found", { status: 404 });
  }
}

async function dataUrlForAsset(name: string) {
  try {
    const path = new URL(name, publicDir);
    const bytes = await Deno.readFile(path);
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return `data:${getMimeType(path.pathname)};base64,${btoa(binary)}`;
  } catch {
    return "";
  }
}

async function showNotification(details: Record<string, unknown> = {}) {
  const NotificationApi = globalThis.Notification;
  if (!NotificationApi) return { ok: true, skipped: true };

  if (NotificationApi.permission !== "granted") {
    const permission = await NotificationApi.requestPermission();
    if (permission !== "granted") return { ok: true, skipped: true };
  }

  const id = String(details.id || `notification-${Date.now()}`);
  const kind = details.kind === "call" ? "call" : "message";
  const notification = new NotificationApi(
    String(details.title || (kind === "call" ? "Incoming call" : "New message")),
    {
      body: String(details.body || ""),
      icon: await dataUrlForAsset("app.png"),
      tag: id,
      requireInteraction: kind === "call",
      silent: Boolean(details.silent),
    },
  );
  notification.onclick = () => {
    showMainWindow();
    queueEvent("notification-action", {
      id,
      kind,
      type: "open",
      openWindow: true,
      peerId: details.peerId || "",
      callId: details.callId || "",
    });
  };
  return { ok: true, id };
}

function showMainWindow() {
  if (!mainWindow) return;
  mainWindow.show();
  mainWindow.focus();
}

async function createTray() {
  const DenoAny = Deno as unknown as {
    Tray?: new () => TrayLike;
  };
  if (!DenoAny.Tray || tray) return;

  tray = new DenoAny.Tray();
  const icon = Deno.build.os === "windows"
    ? new URL("app.ico", assetsDir)
    : new URL("linux-icons/512x512.png", assetsDir);
  await tray.setIcon?.(await Deno.readFile(icon));
  tray.setToolTip?.(appDisplayName);
  tray.onclick = showMainWindow;
  tray.addEventListener?.("click", showMainWindow);
  const menu = [
    { item: { label: "Open", id: "open", enabled: true } },
    "separator",
    { item: { label: "Close", id: "close", enabled: true } },
  ];
  tray.setMenu?.(menu);
  tray.setContextMenu?.(menu);
}

function bindWindow(win: BrowserWindowLike) {
  win.bind("loadConfig", () => loadConfig());
  win.bind("saveConfig", (config) => saveConfig(config as AppConfig));
  win.bind("getConfigPath", () => getConfigPath());
  win.bind("getPlatform", () => platform());
  win.bind("getScreenSources", () => [
    {
      id: "browser-display-media",
      name: "Choose screen or window",
      displayId: "",
      thumbnail: "",
      appIcon: "",
      browserPicker: true,
    },
  ]);
  win.bind("writeClipboard", () => ({ ok: false, useWebClipboard: true }));
  win.bind("getNotificationState", () => ({
    appFocused: false,
    systemDnd: false,
  }));
  win.bind("showNotification", (details) =>
    showNotification(details as Record<string, unknown>));
  win.bind("closeNotification", () => ({ ok: true }));
  win.bind("takeEvents", () => eventQueue.splice(0, eventQueue.length));
  win.bind("realtimeCleanupComplete", () => ({ ok: true }));
  win.bind("windowControl", (action) => {
    if (action === "minimize") win.hide();
    if (action === "maximize") {
      queueEvent("window-control-state", { maximized: false });
    }
    if (action === "close") {
      if (appConfig.appSettings?.closeToTray && !forceQuit) {
        win.hide();
      } else {
        win.close();
      }
    }
    return { ok: true, maximized: false };
  });
  win.bind("openExternal", (url) => {
    const command = Deno.build.os === "windows"
      ? new Deno.Command("cmd", { args: ["/c", "start", "", String(url)] })
      : Deno.build.os === "darwin"
      ? new Deno.Command("open", { args: [String(url)] })
      : new Deno.Command("xdg-open", { args: [String(url)] });
    command.output().catch(() => {});
    return { ok: true };
  });

  win.setApplicationMenu?.([
    {
      submenu: {
        label: appDisplayName,
        items: [
          { item: { label: "Open", id: "open", enabled: true } },
          "separator",
          { item: { label: "Quit", id: "quit", enabled: true } },
        ],
      },
    },
  ]);
  win.addEventListener?.("menuclick", (event) => {
    const id = (event as CustomEvent<{ id?: string }>).detail?.id;
    if (id === "open") showMainWindow();
    if (id === "quit") {
      forceQuit = true;
      Deno.exit(0);
    }
  });
  win.addEventListener?.("close", (event) => {
    if (appConfig.appSettings?.closeToTray && !forceQuit) {
      event.preventDefault();
      win.hide();
    }
  });
}

function startAutoUpdate() {
  const DenoAny = Deno as unknown as {
    autoUpdate?: (options: unknown) => void;
  };
  DenoAny.autoUpdate?.({
    url: releaseBaseUrl,
    interval: 60 * 60 * 1000,
    onUpdateReady(version: string) {
      queueEvent("update-ready", { version });
      console.log("Update", version, "ready; will apply on next launch");
    },
    onRollback(reason: string) {
      console.warn("Previous launch failed; rolled back:", reason);
    },
  });
}

Deno.serve((request) => fileResponse(new URL(request.url), rendererDist));

appConfig = await loadConfig();
await applyAutostartSettings();
startAutoUpdate();

const DenoAny = Deno as unknown as {
  BrowserWindow?: new (options?: Record<string, unknown>) => BrowserWindowLike;
};

if (DenoAny.BrowserWindow) {
  mainWindow = new DenoAny.BrowserWindow({
    title: appDisplayName,
    width: 760,
    height: 560,
    frameless: true,
    resizable: true,
  });
  mainWindow.setTitle?.(`${appDisplayName} ${packageInfo.version}`);
  bindWindow(mainWindow);
  await createTray();
  if (Deno.args.includes("--hidden") || appConfig.appSettings?.startHidden) {
    mainWindow.hide();
  }
}
