import Peer, { util } from "peerjs";
import "@fortawesome/fontawesome-free/css/all.min.css";
import appLogo from "../../assets/app.png";
import packageInfo from "../../package.json";
import "./styles.css";

const titlebarLogo = document.querySelector("#titlebar-logo");
const titlebarSubtitle = document.querySelector("#titlebar-subtitle");
const windowMinimize = document.querySelector("#window-minimize");
const windowMaximize = document.querySelector("#window-maximize");
const windowClose = document.querySelector("#window-close");
const ownId = document.querySelector("#own-id");
const copyId = document.querySelector("#copy-id");
const connectForm = document.querySelector("#connect-form");
const remoteIdInput = document.querySelector("#remote-id");
const connectButton = document.querySelector("#connect-button");
const statusDot = document.querySelector("#status-dot");
const statusText = document.querySelector("#status-text");
const appShell = document.querySelector(".app-shell");
const sidebarResizer = document.querySelector("#sidebar-resizer");
const peerList = document.querySelector("#peer-list");
const chatTitle = document.querySelector("#chat-title");
const callChat = document.querySelector("#call-chat");
const clearChat = document.querySelector("#clear-chat");
const disconnectChat = document.querySelector("#disconnect-chat");
const callBanner = document.querySelector("#call-banner");
const callText = document.querySelector("#call-text");
const callAccept = document.querySelector("#call-accept");
const callDecline = document.querySelector("#call-decline");
const callMute = document.querySelector("#call-mute");
const callDeafen = document.querySelector("#call-deafen");
const callHangup = document.querySelector("#call-hangup");
const messages = document.querySelector("#messages");
const messageForm = document.querySelector("#message-form");
const messageInput = document.querySelector("#message-input");
const sendButton = document.querySelector("#send-button");
const headerUpdateButton = document.querySelector("#header-update-button");
const updateCard = document.querySelector("#update-card");
const updateTitle = document.querySelector("#update-title");
const updateText = document.querySelector("#update-text");
const updateButton = document.querySelector("#update-button");
const updateModal = document.querySelector("#update-modal");
const modalText = document.querySelector("#modal-text");
const modalClose = document.querySelector("#modal-close");
const linuxCommand = document.querySelector("#linux-command");
const copyUpdateCommand = document.querySelector("#copy-update-command");
const settingsModal = document.querySelector("#settings-modal");
const settingsClose = document.querySelector("#settings-close");
const nicknameInput = document.querySelector("#nickname-input");
const saveNickname = document.querySelector("#save-nickname");
const microphoneSelect = document.querySelector("#microphone-select");
const speakerSelect = document.querySelector("#speaker-select");
const micProfileSelect = document.querySelector("#mic-profile-select");
const micModeSelect = document.querySelector("#mic-mode-select");
const micSensitivitySlider = document.querySelector("#mic-sensitivity-slider");
const micSensitivityLabel = document.querySelector("#mic-sensitivity-label");
const micNoiseReductionSlider = document.querySelector("#mic-noise-reduction-slider");
const micNoiseReductionLabel = document.querySelector("#mic-noise-reduction-label");
const micBoostSlider = document.querySelector("#mic-boost-slider");
const micBoostLabel = document.querySelector("#mic-boost-label");
const remoteVolumeSlider = document.querySelector("#remote-volume-slider");
const remoteVolumeLabel = document.querySelector("#remote-volume-label");
const autostartToggle = document.querySelector("#autostart-toggle");
const autostartOpen = document.querySelector("#autostart-open");
const autostartHidden = document.querySelector("#autostart-hidden");
const autostartModeGroup = document.querySelector("#autostart-mode-group");
const closeToTrayToggle = document.querySelector("#close-to-tray-toggle");
const notificationsToggle = document.querySelector("#notifications-toggle");
const messageNotificationsToggle = document.querySelector("#message-notifications-toggle");
const callNotificationsToggle = document.querySelector("#call-notifications-toggle");
const focusedNotificationsToggle = document.querySelector("#focused-notifications-toggle");
const soundsToggle = document.querySelector("#sounds-toggle");
const messageSoundToggle = document.querySelector("#message-sound-toggle");
const ringtoneSoundToggle = document.querySelector("#ringtone-sound-toggle");
const callEventSoundToggle = document.querySelector("#call-event-sound-toggle");
const connectedSoundToggle = document.querySelector("#connected-sound-toggle");
const contactNicknameList = document.querySelector("#contact-nickname-list");
const blockedList = document.querySelector("#blocked-list");
const appMenu = document.querySelector("#app-menu");
const appMenuUpdate = document.querySelector("#app-menu-update");
const appMenuSettings = document.querySelector("#app-menu-settings");
const contactMenu = document.querySelector("#contact-menu");
const menuTrust = document.querySelector("#menu-trust");
const menuPin = document.querySelector("#menu-pin");
const menuNickname = document.querySelector("#menu-nickname");
const menuBlock = document.querySelector("#menu-block");
const messageMenu = document.querySelector("#message-menu");
const menuCopy = document.querySelector("#menu-copy");
const menuDelete = document.querySelector("#menu-delete");
const bootLogo = document.querySelector(".boot-logo");
const bootStatus = document.querySelector("#boot-status");
const bootProgressFill = document.querySelector("#boot-progress-fill");
const bootPercent = document.querySelector("#boot-percent");

const connections = new Map();
const pendingConnections = new Map();
const chatHistory = new Map();
const unreadCounts = new Map();
const remoteIdentities = new Map();
const CHAT_LABEL = "aero-p2p-chat";
const PROTOCOL_VERSION = 1;
const AERO_ID_PATTERN = /^aero-(?:[a-f0-9]{16}|[a-f0-9]{32})$/;
const IDENTITY_STORAGE_KEY = "aero-p2p-chat.identity.v1";
const CONTACTS_STORAGE_KEY = "aero-p2p-chat.contacts.v1";
const MAX_MESSAGE_LENGTH = 4000;
const HIGH_BUFFER_SIZE = 25;
const VOICE_AUDIO_BITRATE = 64000;
const DEFAULT_MIC_SENSITIVITY = 55;
const DEFAULT_MIC_BOOST = 100;
const DEFAULT_MIC_NOISE_REDUCTION = 55;
const DEFAULT_SIDEBAR_WIDTH = 230;
const MIN_SIDEBAR_WIDTH = 190;
const MAX_SIDEBAR_WIDTH = 360;
const MIN_CHAT_WIDTH = 320;
const RESIZER_WIDTH = 12;
const MAX_AUTO_LEVEL = 0.06;
const MIN_AUTO_LEVEL = 0.01;
const MANUAL_LEVEL_RANGE = 0.085;
const VOICE_METER_FFT = 2048;
let activePeerId = null;
let myPeerId = "";
let peer = null;
let availableUpdate = null;
let contacts = [];
let contextContactId = "";
let contextMessage = null;
let removeUpdateProgressListener = null;
const remoteAudio = new Audio();
remoteAudio.autoplay = true;
remoteAudio.playsInline = true;
remoteAudio.volume = 1;
remoteAudio.preload = "auto";
remoteAudio.style.display = "none";
document.body.append(remoteAudio);
const callJoinAudio = new Audio("sound/call-join.ogg");
const callLeaveAudio = new Audio("sound/call-leave.ogg");
const connectedAudio = new Audio("sound/connected.ogg");
const messageAudio = new Audio("sound/message.ogg");
const ringtoneAudio = new Audio("sound/ringtone.ogg");
callJoinAudio.preload = "auto";
callLeaveAudio.preload = "auto";
connectedAudio.preload = "auto";
messageAudio.preload = "auto";
ringtoneAudio.preload = "auto";
ringtoneAudio.loop = true;
let localVoiceAudioContext = null;
let localVoiceMeterFrame = 0;
let localVoiceNoiseFloor = 0.01;
let localVoiceGateNode = null;
let localVoiceBoostNode = null;
let localVoiceCompressorNode = null;
let localVoiceAnalyserNode = null;
let localVoiceProcessingContext = null;
const callState = {
  peerId: null,
  callId: "",
  status: "idle",
  mediaConn: null,
  incomingMediaConn: null,
  localStream: null,
  acceptedIncomingCallId: "",
  muted: false,
  deafened: false,
  mutedBeforeDeafen: null,
  joined: false
};

function setBootProgress(percent, text) {
  const nextPercent = Math.max(0, Math.min(100, Math.round(percent)));
  if (bootProgressFill) {
    bootProgressFill.style.width = `${nextPercent}%`;
  }
  if (bootPercent) {
    bootPercent.textContent = `${nextPercent}%`;
  }
  if (bootStatus && text) {
    bootStatus.textContent = text;
  }
}

function waitForImageReady(image) {
  if (!image) {
    return Promise.resolve();
  }

  if (image.complete && image.naturalWidth > 0) {
    return image.decode ? image.decode().catch(() => {}) : Promise.resolve();
  }

  return new Promise((resolve) => {
    image.addEventListener("load", () => resolve(), { once: true });
    image.addEventListener("error", () => resolve(), { once: true });
  }).then(() => (image.decode ? image.decode().catch(() => {}) : undefined));
}

async function waitForVisualReady() {
  await Promise.all([
    waitForImageReady(titlebarLogo),
    document.fonts?.ready?.catch?.(() => {}) ?? Promise.resolve()
  ]);
}

setBootProgress(4, "Loading logo");

titlebarLogo.src = appLogo;
await waitForImageReady(bootLogo);
setBootProgress(18, "Preparing interface");

const currentVersion = packageInfo.version;
const latestReleaseUrl = "https://github.com/jonasgrimmde/AeroP2Pchat/releases/latest";
const latestManifestUrl = "https://github.com/jonasgrimmde/AeroP2Pchat/releases/latest/download/latest.yml";
const linuxInstallCommand = "curl -fsSL https://raw.githubusercontent.com/jonasgrimmde/AeroP2Pchat/refs/heads/main/install.sh | sh -s -- update";
const platform = window.aeroChat?.platform ?? "browser";
const peerConnectionConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" }
  ],
  iceCandidatePoolSize: 4,
  bundlePolicy: "balanced",
  rtcpMuxPolicy: "require",
  sdpSemantics: "unified-plan"
};
let appConfig = {};

async function loadAppConfig() {
  if (window.aeroChat?.loadConfig) {
    const loaded = await window.aeroChat.loadConfig();
    return loaded && typeof loaded === "object" ? loaded : {};
  }

  return {};
}

function saveAppConfig() {
  if (window.aeroChat?.saveConfig) {
    window.aeroChat.saveConfig(appConfig).catch(() => {});
  }
}

function createIdentityId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return `aero-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function createMessageId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `msg-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function loadIdentity() {
  if (appConfig.identity?.id && isValidAeroId(appConfig.identity.id)) {
    appConfig.identity.nickname = sanitizeNickname(appConfig.identity.nickname);
    appConfig.identity.previousIds = getKnownPreviousIdentityIds(appConfig.identity.previousIds, appConfig.identity.id)
      .filter((id) => id !== appConfig.identity.id);
    return appConfig.identity;
  }

  const identity = {
    id: createIdentityId(),
    nickname: "",
    previousIds: [],
    createdAt: new Date().toISOString()
  };
  appConfig.identity = identity;
  saveAppConfig();
  return identity;
}

function migrateLocalStorageConfig() {
  let changed = false;

  try {
    const storedIdentity = JSON.parse(localStorage.getItem(IDENTITY_STORAGE_KEY) || "null");
    if (!appConfig.identity && storedIdentity?.id && isValidAeroId(storedIdentity.id)) {
      appConfig.identity = storedIdentity;
      changed = true;
    }
  } catch {
    localStorage.removeItem(IDENTITY_STORAGE_KEY);
  }

  try {
    const storedContacts = JSON.parse(localStorage.getItem(CONTACTS_STORAGE_KEY) || "null");
    if (!appConfig.contacts && Array.isArray(storedContacts)) {
      appConfig.contacts = storedContacts;
      changed = true;
    }
  } catch {
    localStorage.removeItem(CONTACTS_STORAGE_KEY);
  }

  if (changed) {
    saveAppConfig();
  }
}

appConfig = await loadAppConfig();
setBootProgress(42, "Loading settings");
migrateLocalStorageConfig();
const identity = loadIdentity();
setBootProgress(55, "Loading identity");

ownId.textContent = identity.id;
nicknameInput.value = identity.nickname || "";
normalizeAudioConfig();
normalizeAppSettings();
applySidebarWidth(appConfig.appSettings.sidebarWidth);
renderAudioSettings();
setupSidebarResizer();

function isValidAeroId(value) {
  return AERO_ID_PATTERN.test(String(value || "").trim());
}

function normalizeAeroId(value) {
  return String(value || "").trim().toLowerCase();
}

function getKnownPreviousIdentityIds(value, ownId = "") {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map(normalizeAeroId).filter((id) => isValidAeroId(id) && id !== ownId))];
}

async function writeClipboardText(text) {
  if (window.aeroChat?.writeClipboard) {
    await window.aeroChat.writeClipboard(text);
    return;
  }

  await navigator.clipboard.writeText(text);
}

function sanitizeNickname(value) {
  return String(value || "").trim().slice(0, 32);
}

function loadContacts() {
  if (!Array.isArray(appConfig.contacts)) {
    return [];
  }

  return appConfig.contacts
    .filter((contact) => isValidAeroId(contact?.id) && contact.id !== identity.id)
    .map((contact) => ({
      id: contact.id,
      label: contact.label || contact.id,
      remoteNickname: sanitizeNickname(contact.remoteNickname),
      customLabel: Boolean(contact.customLabel),
      pinned: contact.pinned !== false,
      trusted: Boolean(contact.trusted),
      blocked: Boolean(contact.blocked),
      pinnedAt: contact.pinnedAt || new Date().toISOString()
    }));
}

function saveContacts() {
  appConfig.contacts = contacts;
  saveAppConfig();
}

function normalizeAudioConfig() {
  if (!appConfig.audio || typeof appConfig.audio !== "object") {
    appConfig.audio = {};
  }

  appConfig.audio.inputDeviceId = typeof appConfig.audio.inputDeviceId === "string" ? appConfig.audio.inputDeviceId : "default";
  appConfig.audio.outputDeviceId = typeof appConfig.audio.outputDeviceId === "string" ? appConfig.audio.outputDeviceId : "default";
  appConfig.audio.remoteVolume = Number.isFinite(appConfig.audio.remoteVolume)
    ? Math.max(0, Math.min(100, Math.round(appConfig.audio.remoteVolume)))
    : 100;
  appConfig.audio.micMode = appConfig.audio.micMode === "manual" ? "manual" : "auto";
  appConfig.audio.micSensitivity = Number.isFinite(appConfig.audio.micSensitivity)
    ? Math.max(0, Math.min(100, Math.round(appConfig.audio.micSensitivity)))
    : DEFAULT_MIC_SENSITIVITY;
  appConfig.audio.micBoost = Number.isFinite(appConfig.audio.micBoost)
    ? Math.max(0, Math.min(200, Math.round(appConfig.audio.micBoost)))
    : DEFAULT_MIC_BOOST;
  appConfig.audio.micNoiseReduction = Number.isFinite(appConfig.audio.micNoiseReduction)
    ? Math.max(0, Math.min(100, Math.round(appConfig.audio.micNoiseReduction)))
    : DEFAULT_MIC_NOISE_REDUCTION;
  appConfig.audio.micProfile = appConfig.audio.micProfile === "custom" ? "custom" : "standard";
}

function saveAudioConfig() {
  normalizeAudioConfig();
  renderAudioSettings();
  saveAppConfig();
}

function setRemoteVolume(volume) {
  normalizeAudioConfig();
  const nextVolume = Math.max(0, Math.min(100, Math.round(volume)));
  appConfig.audio.remoteVolume = nextVolume;
  remoteAudio.volume = nextVolume / 100;
  if (remoteVolumeSlider) {
    remoteVolumeSlider.value = String(nextVolume);
  }
  if (remoteVolumeLabel) {
    remoteVolumeLabel.textContent = `${nextVolume}%`;
  }
}

function setMicSensitivity(value, { persist = false } = {}) {
  normalizeAudioConfig();
  const nextValue = Math.max(0, Math.min(100, Math.round(value)));
  appConfig.audio.micSensitivity = nextValue;
  if (micSensitivitySlider) {
    micSensitivitySlider.value = String(nextValue);
  }
  if (micSensitivityLabel) {
    micSensitivityLabel.textContent = `${nextValue}%`;
  }
  if (persist) {
    saveAudioConfig();
  }
}

function setMicBoost(value, { persist = false } = {}) {
  normalizeAudioConfig();
  const nextValue = Math.max(0, Math.min(200, Math.round(value)));
  appConfig.audio.micBoost = nextValue;
  if (micBoostSlider) {
    micBoostSlider.value = String(nextValue);
  }
  if (micBoostLabel) {
    micBoostLabel.textContent = `${nextValue}%`;
  }
  if (persist) {
    saveAudioConfig();
  }
}

function setMicNoiseReduction(value, { persist = false } = {}) {
  normalizeAudioConfig();
  const nextValue = Math.max(0, Math.min(100, Math.round(value)));
  appConfig.audio.micNoiseReduction = nextValue;
  if (micNoiseReductionSlider) {
    micNoiseReductionSlider.value = String(nextValue);
  }
  if (micNoiseReductionLabel) {
    micNoiseReductionLabel.textContent = `${nextValue}%`;
  }
  if (persist) {
    saveAudioConfig();
  }
}

function setMicMode(mode, { persist = false } = {}) {
  normalizeAudioConfig();
  appConfig.audio.micMode = mode === "manual" ? "manual" : "auto";
  if (micModeSelect) {
    micModeSelect.value = appConfig.audio.micMode;
  }
  if (persist) {
    saveAudioConfig();
  }
}

function setMicProfile(profile, { persist = false } = {}) {
  normalizeAudioConfig();
  appConfig.audio.micProfile = profile === "custom" ? "custom" : "standard";
  if (micProfileSelect) {
    micProfileSelect.value = appConfig.audio.micProfile;
  }
  if (persist) {
    saveAudioConfig();
  }
}

function renderAudioSettings() {
  normalizeAudioConfig();
  if (micProfileSelect) {
    micProfileSelect.value = appConfig.audio.micProfile;
  }
  if (micModeSelect) {
    micModeSelect.value = appConfig.audio.micMode;
  }
  if (micSensitivitySlider) {
    micSensitivitySlider.value = String(appConfig.audio.micSensitivity);
    micSensitivitySlider.disabled = appConfig.audio.micMode === "auto";
  }
  if (micSensitivityLabel) {
    micSensitivityLabel.textContent = `${appConfig.audio.micSensitivity}%`;
  }
  if (micBoostSlider) {
    micBoostSlider.value = String(appConfig.audio.micBoost);
  }
  if (micBoostLabel) {
    micBoostLabel.textContent = `${appConfig.audio.micBoost}%`;
  }
  if (micNoiseReductionSlider) {
    micNoiseReductionSlider.value = String(appConfig.audio.micNoiseReduction);
    micNoiseReductionSlider.disabled = appConfig.audio.micProfile !== "custom";
  }
  if (micNoiseReductionLabel) {
    micNoiseReductionLabel.textContent = `${appConfig.audio.micNoiseReduction}%`;
  }
  if (remoteVolumeSlider) {
    remoteVolumeSlider.value = String(appConfig.audio.remoteVolume);
  }
  if (remoteVolumeLabel) {
    remoteVolumeLabel.textContent = `${appConfig.audio.remoteVolume}%`;
  }
  remoteAudio.volume = appConfig.audio.remoteVolume / 100;
}

function normalizeAppSettings() {
  if (!appConfig.appSettings || typeof appConfig.appSettings !== "object") {
    appConfig.appSettings = {};
  }

  appConfig.appSettings = {
    autostart: appConfig.appSettings.autostart !== false,
    startHidden: appConfig.appSettings.startHidden !== false,
    closeToTray: appConfig.appSettings.closeToTray !== false,
    sidebarWidth: Number.isFinite(appConfig.appSettings.sidebarWidth) ? appConfig.appSettings.sidebarWidth : DEFAULT_SIDEBAR_WIDTH
  };

  appConfig.appSettings.sidebarWidth = Math.round(
    Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, appConfig.appSettings.sidebarWidth))
  );

  if (!appConfig.notificationSettings || typeof appConfig.notificationSettings !== "object") {
    appConfig.notificationSettings = {};
  }
  appConfig.notificationSettings = {
    enabled: appConfig.notificationSettings.enabled !== false,
    messages: appConfig.notificationSettings.messages !== false,
    calls: appConfig.notificationSettings.calls !== false,
    showWhenFocused: Boolean(appConfig.notificationSettings.showWhenFocused)
  };

  if (!appConfig.soundSettings || typeof appConfig.soundSettings !== "object") {
    appConfig.soundSettings = {};
  }
  appConfig.soundSettings = {
    enabled: appConfig.soundSettings.enabled !== false,
    messages: appConfig.soundSettings.messages !== false,
    ringtone: appConfig.soundSettings.ringtone !== false,
    callEvents: appConfig.soundSettings.callEvents !== false,
    connected: appConfig.soundSettings.connected !== false
  };

  if (!appConfig.appSettings.autostart) {
    appConfig.appSettings.startHidden = false;
  }
}

function renderAppSettings() {
  normalizeAppSettings();
  applySidebarWidth(appConfig.appSettings.sidebarWidth);
  autostartToggle.checked = appConfig.appSettings.autostart;
  autostartOpen.checked = !appConfig.appSettings.startHidden;
  autostartHidden.checked = appConfig.appSettings.startHidden;
  autostartOpen.disabled = !appConfig.appSettings.autostart;
  autostartHidden.disabled = !appConfig.appSettings.autostart;
  autostartModeGroup.classList.toggle("disabled", !appConfig.appSettings.autostart);
  closeToTrayToggle.checked = appConfig.appSettings.closeToTray;

  notificationsToggle.checked = appConfig.notificationSettings.enabled;
  messageNotificationsToggle.checked = appConfig.notificationSettings.messages;
  callNotificationsToggle.checked = appConfig.notificationSettings.calls;
  focusedNotificationsToggle.checked = appConfig.notificationSettings.showWhenFocused;
  for (const toggle of [messageNotificationsToggle, callNotificationsToggle, focusedNotificationsToggle]) {
    toggle.disabled = !appConfig.notificationSettings.enabled;
    toggle.closest(".settings-check")?.classList.toggle("disabled", !appConfig.notificationSettings.enabled);
  }

  soundsToggle.checked = appConfig.soundSettings.enabled;
  messageSoundToggle.checked = appConfig.soundSettings.messages;
  ringtoneSoundToggle.checked = appConfig.soundSettings.ringtone;
  callEventSoundToggle.checked = appConfig.soundSettings.callEvents;
  connectedSoundToggle.checked = appConfig.soundSettings.connected;
  for (const toggle of [messageSoundToggle, ringtoneSoundToggle, callEventSoundToggle, connectedSoundToggle]) {
    toggle.disabled = !appConfig.soundSettings.enabled;
    toggle.closest(".settings-check")?.classList.toggle("disabled", !appConfig.soundSettings.enabled);
  }
}

function saveAppSettings(updates = {}) {
  normalizeAppSettings();
  Object.assign(appConfig.appSettings, updates);
  if (!appConfig.appSettings.autostart) {
    appConfig.appSettings.startHidden = false;
  }
  normalizeAppSettings();
  renderAppSettings();
  saveAppConfig();
}

function getSidebarWidthBounds() {
  const shellWidth = appShell?.clientWidth ?? 0;
  const maxByLayout = shellWidth > 0 ? shellWidth - MIN_CHAT_WIDTH - RESIZER_WIDTH : MAX_SIDEBAR_WIDTH;
  const lowerBound = window.innerWidth <= 700 ? 170 : MIN_SIDEBAR_WIDTH;
  return {
    min: lowerBound,
    max: Math.max(lowerBound, Math.min(MAX_SIDEBAR_WIDTH, maxByLayout))
  };
}

function clampSidebarWidth(width) {
  const bounds = getSidebarWidthBounds();
  return Math.round(Math.max(bounds.min, Math.min(bounds.max, width)));
}

function applySidebarWidth(width) {
  if (!appShell) {
    return DEFAULT_SIDEBAR_WIDTH;
  }

  const bounds = getSidebarWidthBounds();
  const nextWidth = clampSidebarWidth(width);
  appShell.style.setProperty("--sidebar-width", `${nextWidth}px`);
  sidebarResizer?.setAttribute("aria-valuemin", String(bounds.min));
  sidebarResizer?.setAttribute("aria-valuemax", String(bounds.max));
  sidebarResizer?.setAttribute("aria-valuenow", String(nextWidth));
  return nextWidth;
}

function setSidebarWidth(width, { persist = false } = {}) {
  const nextWidth = applySidebarWidth(width);
  appConfig.appSettings.sidebarWidth = nextWidth;
  if (persist) {
    saveAppConfig();
  }
  return nextWidth;
}

function setupSidebarResizer() {
  if (!appShell || !sidebarResizer) {
    return;
  }

  let dragPointerId = null;
  let startX = 0;
  let startWidth = appConfig.appSettings.sidebarWidth;

  const stopDragging = ({ persist = true } = {}) => {
    if (dragPointerId !== null) {
      sidebarResizer.releasePointerCapture?.(dragPointerId);
    }
    dragPointerId = null;
    document.body.classList.remove("is-resizing-sidebar");
    document.body.style.removeProperty("user-select");
    if (persist) {
      saveAppConfig();
    }
  };

  sidebarResizer.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    dragPointerId = event.pointerId;
    startX = event.clientX;
    startWidth = appConfig.appSettings.sidebarWidth;
    sidebarResizer.setPointerCapture?.(dragPointerId);
    document.body.classList.add("is-resizing-sidebar");
    document.body.style.userSelect = "none";
    event.preventDefault();
  });

  sidebarResizer.addEventListener("pointermove", (event) => {
    if (dragPointerId !== event.pointerId) {
      return;
    }

    const delta = event.clientX - startX;
    setSidebarWidth(startWidth + delta);
  });

  const endPointerDrag = (event) => {
    if (dragPointerId !== event.pointerId) {
      return;
    }
    stopDragging();
  };

  sidebarResizer.addEventListener("pointerup", endPointerDrag);
  sidebarResizer.addEventListener("pointercancel", endPointerDrag);
  sidebarResizer.addEventListener("lostpointercapture", () => {
    if (dragPointerId !== null) {
      stopDragging();
    }
  });

  sidebarResizer.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") {
      return;
    }

    const step = event.shiftKey ? 24 : 12;
    let nextWidth = appConfig.appSettings.sidebarWidth;

    if (event.key === "ArrowLeft") {
      nextWidth -= step;
    } else if (event.key === "ArrowRight") {
      nextWidth += step;
    } else if (event.key === "Home") {
      nextWidth = getSidebarWidthBounds().min;
    } else if (event.key === "End") {
      nextWidth = getSidebarWidthBounds().max;
    }

    setSidebarWidth(nextWidth, { persist: true });
    event.preventDefault();
  });

  window.addEventListener("resize", () => {
    setSidebarWidth(appConfig.appSettings.sidebarWidth);
  });
}

function saveNotificationSettings(updates = {}) {
  normalizeAppSettings();
  Object.assign(appConfig.notificationSettings, updates);
  normalizeAppSettings();
  renderAppSettings();
  saveAppConfig();
}

function saveSoundSettings(updates = {}) {
  normalizeAppSettings();
  Object.assign(appConfig.soundSettings, updates);
  normalizeAppSettings();
  renderAppSettings();
  saveAppConfig();
}

function findContact(id) {
  return contacts.find((contact) => contact.id === id);
}

function upsertContact(id, updates = {}) {
  if (!isValidAeroId(id) || id === identity.id) {
    return null;
  }

  const existing = findContact(id);
  if (existing) {
    Object.assign(existing, updates);
    if (updates.label) {
      existing.label = updates.label;
    } else if (!existing.label) {
      existing.label = existing.remoteNickname || id;
    }
  } else {
    const label = updates.label || updates.remoteNickname || id;
    contacts.push({
      id,
      label,
      remoteNickname: updates.remoteNickname || "",
      customLabel: Boolean(updates.customLabel),
      pinned: updates.pinned ?? true,
      trusted: Boolean(updates.trusted),
      blocked: Boolean(updates.blocked),
      pinnedAt: new Date().toISOString()
    });
  }

  contacts = contacts.sort((left, right) => {
    if (left.blocked !== right.blocked) {
      return Number(left.blocked) - Number(right.blocked);
    }
    return left.label.localeCompare(right.label);
  });
  saveContacts();
  return findContact(id);
}

function pinContact(id, label = id) {
  return Boolean(upsertContact(id, { label, pinned: true }));
}

function migrateContactIdentity(previousIds, nextId, nickname = "") {
  const targetId = normalizeAeroId(nextId);
  if (!isValidAeroId(targetId) || targetId === identity.id) {
    return null;
  }

  const oldIds = getKnownPreviousIdentityIds(previousIds, identity.id).filter((id) => id !== targetId);
  if (oldIds.length === 0) {
    return findContact(targetId);
  }

  const existingTarget = findContact(targetId);
  const oldContacts = oldIds.map(findContact).filter(Boolean);
  if (oldContacts.length === 0) {
    return existingTarget;
  }

  const preferred = oldContacts.find((contact) => contact.customLabel) || oldContacts[0];
  const remoteNickname = sanitizeNickname(nickname) || existingTarget?.remoteNickname || preferred.remoteNickname;
  const updates = {
    label: preferred.customLabel ? preferred.label : (remoteNickname || existingTarget?.label || preferred.label || targetId),
    remoteNickname,
    customLabel: preferred.customLabel || existingTarget?.customLabel || false,
    pinned: oldContacts.some((contact) => contact.pinned) || existingTarget?.pinned || false,
    trusted: oldContacts.some((contact) => contact.trusted) || existingTarget?.trusted || false,
    blocked: oldContacts.some((contact) => contact.blocked) || existingTarget?.blocked || false
  };

  contacts = contacts.filter((contact) => !oldIds.includes(contact.id));
  const migrated = upsertContact(targetId, updates);
  refreshPeers();
  return migrated;
}

function rememberRemoteIdentity(id, nickname) {
  const remoteNickname = sanitizeNickname(nickname);
  if (!isValidAeroId(id) || !remoteNickname) {
    return;
  }

  const existing = findContact(id);
  upsertContact(id, {
    remoteNickname,
    label: existing?.customLabel ? existing.label : remoteNickname,
    pinned: existing?.pinned ?? true
  });
}

function setContactNickname(id, nickname) {
  const cleanNickname = sanitizeNickname(nickname);
  const existing = findContact(id);
  upsertContact(id, {
    label: cleanNickname || existing?.remoteNickname || id,
    customLabel: Boolean(cleanNickname),
    pinned: true
  });
  refreshPeers();
  renderContactNicknameList();
}

function removeContact(id) {
  const contact = findContact(id);
  if (contact?.blocked) {
    contact.pinned = false;
  } else {
    contacts = contacts.filter((entry) => entry.id !== id);
  }
  saveContacts();
  refreshPeers();
}

function isTrusted(id) {
  return Boolean(findContact(id)?.trusted);
}

function isBlocked(id) {
  return Boolean(findContact(id)?.blocked);
}

function setTrusted(id, trusted) {
  upsertContact(id, { trusted, pinned: true });
  refreshPeers();
}

function setPinned(id, pinned) {
  const contact = upsertContact(id, { pinned });
  if (contact && !pinned && !contact.trusted && !contact.blocked) {
    removeContact(id);
    return;
  }
  refreshPeers();
}

function setBlocked(id, blocked) {
  const contact = upsertContact(id, {
    blocked,
    trusted: blocked ? false : findContact(id)?.trusted || false,
    pinned: blocked ? false : findContact(id)?.pinned ?? true
  });

  if (blocked) {
    connections.get(id)?.close();
    pendingConnections.get(id)?.conn.close();
    removePeer(id);
    addSystemMessage(`${contact.label} blocked.`);
  }

  saveContacts();
  refreshPeers();
  renderBlockedList();
}

function getVisibleContacts() {
  return contacts.filter((contact) => contact.pinned && !contact.blocked);
}

function renderIcon(className) {
  const icon = document.createElement("i");
  icon.className = className;
  icon.setAttribute("aria-hidden", "true");
  return icon;
}

function createBadge(iconClass, title, state = "") {
  const badge = document.createElement("span");
  badge.className = `contact-badge ${state}`.trim();
  badge.title = title;
  badge.append(renderIcon(iconClass));
  return badge;
}

function createContactBadges({ pinned = false, trusted = false, blocked = false, waiting = false, online = false }) {
  const badges = document.createElement("span");
  badges.className = "contact-badges";

  if (online) {
    badges.append(createBadge("fa-solid fa-circle", "Online", "online"));
  }
  if (waiting) {
    badges.append(createBadge("fa-solid fa-hourglass-half", "Waiting", "waiting"));
  }
  if (trusted) {
    badges.append(createBadge("fa-solid fa-shield-halved", "Trusted", "trusted"));
  }
  if (pinned) {
    badges.append(createBadge("fa-solid fa-thumbtack", "Pinned", "pinned"));
  }
  if (blocked) {
    badges.append(createBadge("fa-solid fa-ban", "Blocked", "blocked"));
  }

  return badges;
}

contacts = loadContacts();
setBootProgress(68, "Loading contacts");

function setStatus(kind, text) {
  statusDot.className = `status-dot ${kind}`;
  statusText.textContent = text;
  titlebarSubtitle.textContent = text;
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function updateConnectButton() {
  const remoteId = normalizeAeroId(remoteIdInput.value);
  connectButton.disabled = !isValidAeroId(remoteId) || remoteId === identity.id || !peer?.open;
}

function ensureChatHistory(peerId) {
  if (!chatHistory.has(peerId)) {
    chatHistory.set(peerId, []);
  }

  return chatHistory.get(peerId);
}

function updateEmptyChatState() {
  if (!activePeerId) {
    messages.dataset.empty = "Share your Aero ID or connect to a contact.";
  } else {
    const activeConn = connections.get(activePeerId);
    messages.dataset.empty = `No messages with ${getPeerLabel(activePeerId, activeConn)} yet.`;
  }

  messages.classList.toggle("empty", messages.childElementCount === 0);
}

function createSystemMessage(text) {
  const row = document.createElement("div");
  row.className = "message-row system";
  row.textContent = text;
  return row;
}

function createChatMessage(item) {
  const { id, text, sender, peerId, time } = item;
  const row = document.createElement("div");
  row.className = `message-row ${sender === "me" ? "mine" : "theirs"}`;
  row.dataset.messageId = id;

  const bubble = document.createElement("article");
  bubble.className = "bubble";

  const meta = document.createElement("span");
  meta.className = "bubble-meta";
  meta.textContent = `${sender === "me" ? "You" : getPeerLabel(peerId, connections.get(peerId))} · ${time ?? formatTime()}`;

  const body = document.createElement("p");
  body.textContent = text;

  bubble.append(meta, body);
  row.append(bubble);

  bubble.addEventListener("contextmenu", (event) => {
    openMessageMenu(event, item);
  });

  return row;
}

function appendMessageRow(row) {
  messages.append(row);
  messages.scrollTop = messages.scrollHeight;
  updateEmptyChatState();
}

function renderChatHistory() {
  messages.replaceChildren();

  if (activePeerId) {
    for (const item of ensureChatHistory(activePeerId)) {
      appendMessageRow(createChatMessage(item));
    }
  }

  updateEmptyChatState();
}

function parseManifest(text) {
  const manifest = {};
  for (const line of text.split(/\r?\n/)) {
    const match = /^([a-zA-Z0-9_-]+):\s*(.*)$/.exec(line.trim());
    if (!match) {
      continue;
    }

    const key = match[1];
    let value = match[2].trim();
    if (value.startsWith("\"") && value.endsWith("\"")) {
      value = JSON.parse(value);
    }
    manifest[key] = value;
  }
  return manifest;
}

function compareVersions(left, right) {
  const leftParts = String(left).split(".").map((part) => Number(part) || 0);
  const rightParts = String(right).split(".").map((part) => Number(part) || 0);

  for (let index = 0; index < 3; index += 1) {
    if ((leftParts[index] || 0) > (rightParts[index] || 0)) {
      return 1;
    }
    if ((leftParts[index] || 0) < (rightParts[index] || 0)) {
      return -1;
    }
  }

  return 0;
}

function clearUpdateAvailableUi() {
  availableUpdate = null;
  headerUpdateButton.classList.add("hidden");
  updateCard.classList.add("hidden");
  titlebarLogo.classList.remove("update-available");
  titlebarLogo.removeAttribute("title");
  appMenuUpdate.classList.add("hidden");
}

async function checkForUpdates() {
  try {
    const response = await fetch(`${latestManifestUrl}?t=${Date.now()}`, {
      cache: "no-store"
    });
    if (!response.ok) {
      return;
    }

    const manifest = parseManifest(await response.text());
    const latestVersion = manifest.version;
    if (!latestVersion || compareVersions(latestVersion, currentVersion) <= 0) {
      clearUpdateAvailableUi();
      return;
    }

    const windowsUrl = manifest.windowsUrl || manifest.windows_url || manifest.url || "";
    const windowsSha256 = manifest.windowsSha256 || manifest.windows_sha256 || manifest.sha256 || "";
    const windowsSha512 = manifest.windowsSha512 || manifest.windows_sha512 || manifest.sha512 || "";
    if (platform === "win32" && !windowsUrl) {
      clearUpdateAvailableUi();
      return;
    }
    if (platform === "win32" && (!windowsSha256 || !windowsSha512)) {
      clearUpdateAvailableUi();
      return;
    }

    availableUpdate = {
      version: latestVersion,
      windowsUrl,
      windowsSha256,
      windowsSha512
    };

    updateTitle.textContent = "Update available";
    updateText.textContent = `Version ${latestVersion} is ready. You are using ${currentVersion}.`;
    updateButton.textContent = platform === "win32" ? "Install update" : "Show command";
    headerUpdateButton.classList.add("hidden");
    titlebarLogo.classList.add("update-available");
    titlebarLogo.title = `Update ${latestVersion} available`;
    appMenuUpdate.classList.remove("hidden");
    appMenuUpdate.querySelector("span").textContent = platform === "win32" ? `Install ${latestVersion}` : `Update ${latestVersion}`;
  } catch {
    clearUpdateAvailableUi();
  }
}

function addSystemMessage(text) {
  appendMessageRow(createSystemMessage(text));
}

function addChatMessage({ id, text, sender, peerId, time }) {
  const item = { id: id ?? createMessageId(), text, sender, peerId, time: time ?? formatTime() };
  ensureChatHistory(peerId).push(item);

  if (activePeerId === peerId) {
    appendMessageRow(createChatMessage(item));
    return;
  }

  unreadCounts.set(peerId, (unreadCounts.get(peerId) || 0) + 1);
  refreshPeers();
}

function showAppNotification(details) {
  normalizeAppSettings();
  if (!appConfig.notificationSettings.enabled) {
    return false;
  }

  if (!appConfig.notificationSettings.showWhenFocused && document.visibilityState === "visible" && document.hasFocus()) {
    return false;
  }

  window.aeroChat?.showNotification?.({
    ...details,
    showWhenFocused: appConfig.notificationSettings.showWhenFocused
  }).catch(() => {});
  return true;
}

function shouldPlaySound(key) {
  normalizeAppSettings();
  return Boolean(appConfig.soundSettings.enabled && appConfig.soundSettings[key]);
}

function playSound(audio, key) {
  if (!shouldPlaySound(key)) {
    return;
  }

  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function isAppFocused() {
  return document.visibilityState === "visible" && document.hasFocus();
}

function playMessageFallbackSound() {
  if (isAppFocused()) {
    return;
  }

  playSound(messageAudio, "messages");
}

function playLocalRingtone() {
  playSound(ringtoneAudio, "ringtone");
}

function stopLocalRingtone() {
  ringtoneAudio.pause();
  ringtoneAudio.currentTime = 0;
}

function closeAppNotification(id) {
  if (!id) {
    return;
  }

  window.aeroChat?.closeNotification?.(id).catch(() => {});
}

function getCallNotificationId(callId) {
  return callId ? `call-${callId}` : "";
}

function closeCallNotification(callId = callState.callId) {
  closeAppNotification(getCallNotificationId(callId));
  stopLocalRingtone();
}

function playCallJoinSound() {
  playSound(callJoinAudio, "callEvents");
}

function playCallLeaveSound() {
  playSound(callLeaveAudio, "callEvents");
}

function playConnectedSound() {
  playSound(connectedAudio, "connected");
}

function notifyIncomingMessage(peerId, text) {
  normalizeAppSettings();
  if (!appConfig.notificationSettings.messages) {
    playMessageFallbackSound();
    return;
  }

  const conn = connections.get(peerId);
  const shown = showAppNotification({
    kind: "message",
    peerId,
    title: getPeerLabel(peerId, conn),
    body: text,
    silent: !shouldPlaySound("messages")
  });
  if (!shown) {
    playMessageFallbackSound();
  }
}

function notifyIncomingCall(peerId, callId) {
  normalizeAppSettings();
  if (!appConfig.notificationSettings.calls) {
    playLocalRingtone();
    return;
  }

  const conn = connections.get(peerId);
  showAppNotification({
    id: getCallNotificationId(callId),
    kind: "call",
    peerId,
    callId,
    title: "Incoming voice call",
    body: `${getPeerLabel(peerId, conn)} is calling`,
    silent: !shouldPlaySound("ringtone")
  });
}

function sendChatText(peerId, rawText) {
  const text = String(rawText || "").trim();
  if (!text) {
    return false;
  }

  const conn = connections.get(peerId);
  if (!conn?.open) {
    setStatus("offline", "The active peer is not ready yet.");
    return false;
  }

  if (conn.bufferSize > HIGH_BUFFER_SIZE) {
    setStatus("pending", "Waiting for the send buffer to drain...");
    return false;
  }

  const messageId = createMessageId();
  const payload = {
    type: "chat-message",
    id: messageId,
    protocol: PROTOCOL_VERSION,
    text: text.slice(0, MAX_MESSAGE_LENGTH),
    time: formatTime()
  };

  try {
    conn.send(payload);
  } catch (error) {
    setStatus("offline", `Send failed: ${error.message}`);
    return false;
  }

  addChatMessage({
    id: messageId,
    text: payload.text,
    sender: "me",
    peerId,
    time: payload.time
  });
  return true;
}

function createCallId() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return `call-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function getActiveCallLabel() {
  if (!callState.peerId) {
    return "";
  }

  return getPeerLabel(callState.peerId, connections.get(callState.peerId));
}

function stopLocalCallStream() {
  callState.localStream?._rawVoiceStream?.getTracks().forEach((track) => track.stop());
  callState.localStream?.getTracks().forEach((track) => track.stop());
  callState.localStream = null;
}

function clearRemoteAudio() {
  remoteAudio.pause();
  remoteAudio.srcObject = null;
  remoteAudio.load();
}

function isCallBusy() {
  return callState.status !== "idle";
}

function refreshCallUi() {
  const activeConn = activePeerId ? connections.get(activePeerId) : null;
  const canStartCall = Boolean(activeConn?.open && !isCallBusy());
  callChat.disabled = !canStartCall;

  callAccept.classList.add("hidden");
  callDecline.classList.add("hidden");
  callMute.classList.add("hidden");
  callDeafen.classList.add("hidden");
  callHangup.classList.add("hidden");
  callMute.classList.toggle("active", callState.muted);
  callDeafen.classList.toggle("active", callState.deafened);
  callMute.querySelector("span").textContent = callState.muted ? "Unmute" : "Mute";
  callDeafen.querySelector("span").textContent = callState.deafened ? "Undeafen" : "Deafen";
  callMute.title = callState.muted ? "Unmute microphone" : "Mute microphone";
  callDeafen.title = callState.deafened ? "Undeafen" : "Deafen";
  callMute.setAttribute("aria-label", callMute.title);
  callDeafen.setAttribute("aria-label", callDeafen.title);

  if (callState.status === "idle") {
    callBanner.classList.add("hidden");
    return;
  }

  callBanner.classList.remove("hidden");
  const label = getActiveCallLabel() || "Peer";

  if (callState.status === "incoming") {
    callText.textContent = `${label} is calling`;
    callAccept.classList.remove("hidden");
    callDecline.classList.remove("hidden");
    return;
  }

  if (callState.status === "outgoing") {
    callText.textContent = `Calling ${label}...`;
    callHangup.classList.remove("hidden");
    return;
  }

  if (callState.status === "connecting") {
    callText.textContent = `Connecting voice with ${label}...`;
    callMute.classList.remove("hidden");
    callDeafen.classList.remove("hidden");
    callHangup.classList.remove("hidden");
    return;
  }

  callText.textContent = `In voice call with ${label}`;
  callMute.classList.remove("hidden");
  callDeafen.classList.remove("hidden");
  callHangup.classList.remove("hidden");
}

function setCallState(status, updates = {}) {
  Object.assign(callState, updates, { status });
  applyLocalMuteState();
  remoteAudio.muted = callState.deafened;
  refreshCallUi();
}

function resetCallState() {
  const mediaConn = callState.mediaConn;
  const incomingMediaConn = callState.incomingMediaConn;
  const localStream = callState.localStream;

  Object.assign(callState, {
    peerId: null,
    callId: "",
    status: "idle",
    mediaConn: null,
    incomingMediaConn: null,
    localStream: null,
    acceptedIncomingCallId: "",
    muted: false,
    deafened: false,
    mutedBeforeDeafen: null,
    joined: false
  });

  mediaConn?.close();
  if (incomingMediaConn && incomingMediaConn !== mediaConn) {
    incomingMediaConn.close();
  }
  localStream?._rawVoiceStream?.getTracks().forEach((track) => track.stop());
  localStream?.getTracks().forEach((track) => track.stop());
  resetVoiceProcessingState();
  localVoiceAudioContext?.close().catch(() => {});
  localVoiceAudioContext = null;
  stopLocalRingtone();
  clearRemoteAudio();
  refreshCallUi();
}

function applyLocalMuteState() {
  callState.localStream?.getAudioTracks().forEach((track) => {
    track.enabled = !callState.muted;
  });
}

function setCallMuted(muted) {
  callState.muted = Boolean(muted);
  applyLocalMuteState();
  refreshCallUi();
}

function setCallDeafened(deafened) {
  const nextDeafened = Boolean(deafened);
  if (nextDeafened && !callState.deafened) {
    callState.mutedBeforeDeafen = callState.muted;
    callState.muted = true;
  }
  if (!nextDeafened && callState.deafened) {
    callState.muted = Boolean(callState.mutedBeforeDeafen);
    callState.mutedBeforeDeafen = null;
  }

  callState.deafened = nextDeafened;
  applyLocalMuteState();
  remoteAudio.muted = callState.deafened;
  refreshCallUi();
}

function stopVoiceMeterLoop() {
  if (localVoiceMeterFrame) {
    cancelAnimationFrame(localVoiceMeterFrame);
    localVoiceMeterFrame = 0;
  }
}

function resetVoiceProcessingState() {
  stopVoiceMeterLoop();
  localVoiceNoiseFloor = 0.01;
  localVoiceGateNode = null;
  localVoiceBoostNode = null;
  localVoiceCompressorNode = null;
  localVoiceAnalyserNode = null;
  localVoiceProcessingContext = null;
}

function getMicGateThreshold({ profile, mode, sensitivity, noiseFloor }) {
  const thresholdMin = profile === "custom" ? 0.008 : 0.01;
  const thresholdMax = profile === "custom" ? 0.08 : 0.06;

  if (mode === "auto") {
    const floor = Number.isFinite(noiseFloor) ? noiseFloor : 0.01;
    return Math.max(thresholdMin, Math.min(thresholdMax, floor * 2.6 + 0.004));
  }

  const normalized = Math.max(0, Math.min(100, Number(sensitivity) || 0)) / 100;
  return thresholdMax - normalized * (thresholdMax - thresholdMin);
}

function getMicNoiseReductionFactor() {
  normalizeAudioConfig();
  const value = appConfig.audio.micNoiseReduction ?? DEFAULT_MIC_NOISE_REDUCTION;
  return Math.max(0, Math.min(100, value)) / 100;
}

function updateVoiceMeter() {
  if (!localVoiceAnalyserNode || !localVoiceGateNode || !localVoiceBoostNode || !localVoiceProcessingContext) {
    return;
  }

  const audio = appConfig.audio || {};
  const buffer = new Float32Array(localVoiceAnalyserNode.fftSize);
  localVoiceAnalyserNode.getFloatTimeDomainData(buffer);

  let sumSquares = 0;
  for (const sample of buffer) {
    sumSquares += sample * sample;
  }

  const rms = Math.sqrt(sumSquares / buffer.length);
  if (audio.micMode === "auto") {
    if (rms < localVoiceNoiseFloor * 1.4) {
      localVoiceNoiseFloor = localVoiceNoiseFloor * 0.94 + rms * 0.06;
    } else {
      localVoiceNoiseFloor = localVoiceNoiseFloor * 0.995 + rms * 0.005;
    }
  }

  const threshold = getMicGateThreshold({
    profile: audio.micProfile,
    mode: audio.micMode,
    sensitivity: audio.micSensitivity,
    noiseFloor: localVoiceNoiseFloor + getMicNoiseReductionFactor() * 0.02
  });
  const now = localVoiceProcessingContext.currentTime;
  const gateOpen = rms >= threshold ? 1 : 0.0001;

  localVoiceGateNode.gain.setTargetAtTime(gateOpen, now, gateOpen > 0.5 ? 0.01 : 0.08);
  localVoiceBoostNode.gain.setTargetAtTime((audio.micBoost || DEFAULT_MIC_BOOST) / 100, now, 0.03);

  localVoiceMeterFrame = requestAnimationFrame(updateVoiceMeter);
}

function startVoiceMeterLoop() {
  stopVoiceMeterLoop();
  localVoiceMeterFrame = requestAnimationFrame(updateVoiceMeter);
}

async function applyAudioOutputDevice() {
  if (!remoteAudio.setSinkId) {
    return;
  }

  normalizeAudioConfig();
  try {
    await remoteAudio.setSinkId(appConfig.audio.outputDeviceId || "default");
  } catch {
    appConfig.audio.outputDeviceId = "default";
    saveAudioConfig();
    await remoteAudio.setSinkId("default").catch(() => {});
  }
}

function createVoiceAudioConstraints() {
  normalizeAudioConfig();
  const deviceId = appConfig.audio.inputDeviceId;
  const useStandardProfile = appConfig.audio.micProfile !== "custom";
  const audio = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: useStandardProfile,
    channelCount: { ideal: 1 },
    sampleRate: { ideal: 48000 },
    sampleSize: { ideal: 16 },
    latency: { ideal: 0.02 }
  };

  if (deviceId && deviceId !== "default") {
    audio.deviceId = { exact: deviceId };
  }

  return audio;
}

function improveVoiceSdp(sdp = "") {
  const opusPayloads = Array.from(sdp.matchAll(/^a=rtpmap:(\d+) opus\/48000(?:\/\d+)?$/gim), (match) => match[1]);
  let nextSdp = sdp;

  if (!/^a=ptime:/im.test(nextSdp)) {
    nextSdp = nextSdp.replace(/^(m=audio[^\r\n]*\r?\n)/im, "$1a=ptime:20\r\n");
  }

  for (const payload of opusPayloads) {
    const fmtpPattern = new RegExp(`^a=fmtp:${payload} ([^\\r\\n]*)$`, "im");
    const fmtpMatch = nextSdp.match(fmtpPattern);
    const params = [
      "minptime=10",
      "useinbandfec=1",
      "maxplaybackrate=48000",
      "sprop-maxcapturerate=48000",
      `maxaveragebitrate=${VOICE_AUDIO_BITRATE}`
    ];

    if (fmtpMatch) {
      let line = fmtpMatch[0];
      for (const param of params) {
        const key = param.split("=")[0];
        if (!new RegExp(`(?:^|;)${key}=`).test(line)) {
          line += `;${param}`;
        }
      }
      nextSdp = nextSdp.replace(fmtpPattern, line);
      continue;
    }

    nextSdp = nextSdp.replace(
      new RegExp(`^(a=rtpmap:${payload} opus\\/48000(?:\\/\\d+)?)$`, "im"),
      `$1\r\na=fmtp:${payload} ${params.join(";")}`
    );
  }

  return nextSdp;
}

async function tuneOutgoingAudio(mediaConn) {
  const peerConnection = mediaConn?.peerConnection;
  if (!peerConnection?.getSenders) {
    return;
  }

  for (const sender of peerConnection.getSenders()) {
    if (sender.track?.kind !== "audio" || !sender.getParameters || !sender.setParameters) {
      continue;
    }

    const parameters = sender.getParameters();
    parameters.encodings = parameters.encodings?.length ? parameters.encodings : [{}];
    parameters.encodings[0].maxBitrate = VOICE_AUDIO_BITRATE;
    parameters.encodings[0].priority = "high";
    await sender.setParameters(parameters).catch(() => {});
  }
}

async function getVoiceStream() {
  const rawStream = await navigator.mediaDevices.getUserMedia({
    audio: createVoiceAudioConstraints(),
    video: false
  });
  await refreshAudioDevices();

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (typeof AudioContextClass !== "function") {
    return rawStream;
  }

  try {
    resetVoiceProcessingState();
    localVoiceAudioContext?.close().catch(() => {});
    localVoiceAudioContext = new AudioContextClass();
    localVoiceProcessingContext = localVoiceAudioContext;
    await localVoiceAudioContext.resume().catch(() => {});
    const source = localVoiceAudioContext.createMediaStreamSource(rawStream);
    const highpass = localVoiceAudioContext.createBiquadFilter();
    const analyser = localVoiceAudioContext.createAnalyser();
    const compressor = localVoiceAudioContext.createDynamicsCompressor();
    const boostNode = localVoiceAudioContext.createGain();
    const gateNode = localVoiceAudioContext.createGain();
    const destination = localVoiceAudioContext.createMediaStreamDestination();
    const useStandardProfile = appConfig.audio.micProfile !== "custom";
    const noiseReduction = appConfig.audio.micNoiseReduction ?? DEFAULT_MIC_NOISE_REDUCTION;
    const noiseReductionFactor = Math.max(0, Math.min(100, noiseReduction)) / 100;

    highpass.type = "highpass";
    highpass.frequency.value = useStandardProfile ? 90 : 75 + noiseReductionFactor * 35;
    highpass.Q.value = 0.707;
    analyser.fftSize = VOICE_METER_FFT;
    compressor.threshold.value = useStandardProfile ? -28 : -24 - noiseReductionFactor * 6;
    compressor.knee.value = useStandardProfile ? 18 : 14 - noiseReductionFactor * 2;
    compressor.ratio.value = useStandardProfile ? 3.2 : 2.5 + noiseReductionFactor * 1.3;
    compressor.attack.value = 0.003;
    compressor.release.value = useStandardProfile ? 0.22 : 0.28 + noiseReductionFactor * 0.06;
    gateNode.gain.value = 0.0001;
    boostNode.gain.value = Math.max(0, Math.min(2, (appConfig.audio.micBoost || DEFAULT_MIC_BOOST) / 100));

    source.connect(highpass);
    highpass.connect(analyser);
    analyser.connect(gateNode);
    gateNode.connect(compressor);
    compressor.connect(boostNode);
    boostNode.connect(destination);

    localVoiceAnalyserNode = analyser;
    localVoiceGateNode = gateNode;
    localVoiceCompressorNode = compressor;
    localVoiceBoostNode = boostNode;
    localVoiceNoiseFloor = 0.01;
    if (micNoiseReductionSlider) {
      micNoiseReductionSlider.disabled = useStandardProfile;
    }
    startVoiceMeterLoop();
    destination.stream._rawVoiceStream = rawStream;
    return destination.stream;
  } catch {
    resetVoiceProcessingState();
    localVoiceAudioContext?.close().catch(() => {});
    localVoiceAudioContext = null;
    return rawStream;
  }
}

function attachMediaConnectionHandlers(mediaConn, peerId, callId) {
  callState.mediaConn = mediaConn;
  tuneOutgoingAudio(mediaConn);

  mediaConn.on("stream", async (stream) => {
    if (callState.peerId !== peerId || callState.callId !== callId) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    remoteAudio.srcObject = stream;
    setRemoteVolume(appConfig.audio.remoteVolume);
    remoteAudio.muted = callState.deafened;
    await applyAudioOutputDevice();
    remoteAudio.play().catch(() => {});
    if (!callState.joined) {
      callState.joined = true;
      playCallJoinSound();
    }
    setCallState("active");
    setStatus("online", `Voice call with ${getPeerLabel(peerId, connections.get(peerId))}`);
  });

  mediaConn.on("close", () => {
    if (callState.peerId === peerId && callState.callId === callId) {
      endVoiceCall({ notifyPeer: false, message: "Voice call ended." });
    }
  });

  mediaConn.on("error", (error) => {
    if (callState.peerId === peerId && callState.callId === callId) {
      addSystemMessage(`Voice call error: ${error.message}`);
      endVoiceCall({ notifyPeer: true, message: "Voice call ended." });
    }
  });
}

async function startVoiceCall() {
  if (!activePeerId || isCallBusy()) {
    return;
  }

  const conn = connections.get(activePeerId);
  if (!conn?.open) {
    setStatus("offline", "The active peer is not ready yet.");
    return;
  }

  const callId = createCallId();
  setCallState("outgoing", { peerId: activePeerId, callId });
  sendProtocolMessage(conn, "call-request", { callId });
  addSystemMessage(`Calling ${getPeerLabel(activePeerId, conn)}...`);
}

function handleIncomingCallRequest(peerId, data) {
  if (!connections.has(peerId) || typeof data.callId !== "string") {
    return;
  }

  const conn = connections.get(peerId);
  if (isCallBusy()) {
    sendProtocolMessage(conn, "call-declined", { callId: data.callId, reason: "busy" });
    return;
  }

  setCallState("incoming", { peerId, callId: data.callId });
  addSystemMessage(`${getPeerLabel(peerId, conn)} is calling.`);
  notifyIncomingCall(peerId, data.callId);
}

async function acceptVoiceCall() {
  if (callState.status !== "incoming" || !callState.peerId) {
    return;
  }

  const peerId = callState.peerId;
  const callId = callState.callId;
  const conn = connections.get(peerId);

  closeCallNotification(callId);
  setCallState("connecting", { peerId, callId });

  try {
    const stream = await getVoiceStream();
    setCallState("connecting", {
      peerId,
      callId,
      localStream: stream,
      acceptedIncomingCallId: callId
    });
    sendProtocolMessage(conn, "call-accepted", { callId });

    if (callState.incomingMediaConn?.metadata?.callId === callId) {
      callState.incomingMediaConn.answer(stream);
      tuneOutgoingAudio(callState.incomingMediaConn);
      attachMediaConnectionHandlers(callState.incomingMediaConn, peerId, callId);
    }
  } catch (error) {
    closeCallNotification(callId);
    sendProtocolMessage(conn, "call-declined", { callId, reason: "microphone-error" });
    addSystemMessage(`Could not start microphone: ${error.message}`);
    resetCallState();
  }
}

function declineVoiceCall() {
  if (callState.status !== "incoming" || !callState.peerId) {
    return;
  }

  closeCallNotification();
  const conn = connections.get(callState.peerId);
  sendProtocolMessage(conn, "call-declined", { callId: callState.callId });
  addSystemMessage(`Call from ${getPeerLabel(callState.peerId, conn)} declined.`);
  resetCallState();
}

async function handleCallAccepted(peerId, data) {
  if (callState.status !== "outgoing" || callState.peerId !== peerId || callState.callId !== data.callId) {
    return;
  }

  try {
    const stream = await getVoiceStream();
    const mediaConn = peer.call(peerId, stream, {
      metadata: {
        ...createChatMetadata(),
        callId: callState.callId
      },
      sdpTransform: improveVoiceSdp
    });
    setCallState("connecting", { localStream: stream, mediaConn });
    attachMediaConnectionHandlers(mediaConn, peerId, callState.callId);
  } catch (error) {
    addSystemMessage(`Could not start microphone: ${error.message}`);
    sendProtocolMessage(connections.get(peerId), "call-ended", { callId: callState.callId });
    resetCallState();
  }
}

function handleCallDeclined(peerId, data) {
  if (callState.peerId !== peerId || callState.callId !== data.callId) {
    return;
  }

  const label = getPeerLabel(peerId, connections.get(peerId));
  addSystemMessage(data.reason === "busy" ? `${label} is busy.` : `${label} declined the call.`);
  resetCallState();
}

function endVoiceCall({ notifyPeer = true, message = "" } = {}) {
  const peerId = callState.peerId;
  const callId = callState.callId;
  const conn = peerId ? connections.get(peerId) : null;
  const wasJoined = callState.joined;

  closeCallNotification(callId);
  if (notifyPeer && conn?.open && callId) {
    sendProtocolMessage(conn, "call-ended", { callId });
  }

  resetCallState();
  if (wasJoined) {
    playCallLeaveSound();
  }
  if (message) {
    addSystemMessage(message);
  }
  setStatus(connections.size > 0 ? "online" : "pending", connections.size > 0 ? "Peer connected" : "Ready to connect");
}

function handleRemoteCallEnded(peerId, data) {
  if (callState.peerId !== peerId || callState.callId !== data.callId) {
    return;
  }

  endVoiceCall({ notifyPeer: false, message: "Voice call ended." });
}

function rejectIncomingMediaCall(mediaConn) {
  mediaConn.answer();
  mediaConn.close();
}

function handleIncomingMediaCall(mediaConn) {
  const callId = mediaConn.metadata?.callId;
  const peerId = mediaConn.peer;
  if (
    callState.peerId !== peerId ||
    callState.callId !== callId ||
    callState.acceptedIncomingCallId !== callId ||
    !callState.localStream
  ) {
    rejectIncomingMediaCall(mediaConn);
    return;
  }

  callState.incomingMediaConn = mediaConn;
  mediaConn.answer(callState.localStream, { sdpTransform: improveVoiceSdp });
  tuneOutgoingAudio(mediaConn);
  attachMediaConnectionHandlers(mediaConn, peerId, callId);
}

function createDeviceOption(value, text) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  return option;
}

function setSelectValueOrDefault(select, value) {
  select.value = value;
  if (select.value !== value) {
    select.value = "default";
  }
}

async function refreshAudioDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) {
    microphoneSelect.replaceChildren(createDeviceOption("default", "Default microphone"));
    speakerSelect.replaceChildren(createDeviceOption("default", "Default output"));
    return;
  }

  normalizeAudioConfig();
  const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
  const microphones = devices.filter((device) => device.kind === "audioinput");
  const speakers = devices.filter((device) => device.kind === "audiooutput");

  microphoneSelect.replaceChildren(createDeviceOption("default", "Default microphone"));
  for (const [index, device] of microphones.entries()) {
    if (device.deviceId === "default") {
      continue;
    }
    microphoneSelect.append(createDeviceOption(device.deviceId, device.label || `Microphone ${index + 1}`));
  }

  speakerSelect.replaceChildren(createDeviceOption("default", "Default output"));
  for (const [index, device] of speakers.entries()) {
    if (device.deviceId === "default") {
      continue;
    }
    speakerSelect.append(createDeviceOption(device.deviceId, device.label || `Output ${index + 1}`));
  }

  setSelectValueOrDefault(microphoneSelect, appConfig.audio.inputDeviceId);
  setSelectValueOrDefault(speakerSelect, appConfig.audio.outputDeviceId);
}

function isSupportedDataChannel() {
  return Boolean(util.supports?.data && util.supports?.reliable);
}

function createChatMetadata() {
  return {
    app: "Aero P2P Chat",
    identityId: identity.id,
    previousIdentityIds: getKnownPreviousIdentityIds(identity.previousIds, identity.id),
    nickname: identity.nickname || "",
    protocol: PROTOCOL_VERSION,
    version: currentVersion
  };
}

function rememberConnectionIdentity(peerId, metadata = {}) {
  const identityId = metadata.identityId;
  if (!isValidAeroId(identityId) || identityId === identity.id) {
    return;
  }

  const nickname = sanitizeNickname(metadata.nickname);
  migrateContactIdentity(metadata.previousIdentityIds, identityId, nickname);
  remoteIdentities.set(peerId, { identityId, nickname });
  if (nickname) {
    rememberRemoteIdentity(identityId, nickname);
    return;
  }

  const existing = findContact(identityId);
  if (existing && !existing.customLabel && existing.label === identity.nickname) {
    upsertContact(identityId, { label: identityId, pinned: existing.pinned });
  }
}

function getPeerLabel(peerId, conn) {
  const remoteIdentity = remoteIdentities.get(peerId);
  const identityId = remoteIdentity?.identityId || peerId;
  return findContact(identityId)?.label || remoteIdentity?.nickname || identityId;
}

function getPeerIdentityId(peerId, conn) {
  return remoteIdentities.get(peerId)?.identityId || peerId;
}

function openContactMenu(event, id) {
  event.preventDefault();
  closeMessageMenu();
  closeAppMenu();
  contextContactId = id;

  const contact = findContact(id);
  menuTrust.querySelector("span").textContent = contact?.trusted ? "Untrust" : "Trust";
  menuPin.querySelector("span").textContent = contact?.pinned ? "Unpin" : "Pin";
  menuNickname.querySelector("span").textContent = contact?.customLabel ? "Edit nickname" : "Add nickname";
  menuBlock.querySelector("span").textContent = contact?.blocked ? "Unblock" : "Block";

  contactMenu.style.left = `${Math.min(event.clientX, window.innerWidth - 164)}px`;
  contactMenu.style.top = `${Math.min(event.clientY, window.innerHeight - 132)}px`;
  contactMenu.classList.remove("hidden");
}

function closeContactMenu() {
  contactMenu.classList.add("hidden");
  contextContactId = "";
}

function openAppMenu(event) {
  event.preventDefault();
  closeContactMenu();
  closeMessageMenu();

  const rect = titlebarLogo.getBoundingClientRect();
  appMenu.style.left = `${Math.min(rect.left, window.innerWidth - 164)}px`;
  appMenu.style.top = `${Math.min(rect.bottom + 6, window.innerHeight - 44)}px`;
  appMenu.classList.remove("hidden");
}

function closeAppMenu() {
  appMenu.classList.add("hidden");
}

function openMessageMenu(event, messageItem) {
  event.preventDefault();
  closeContactMenu();
  closeAppMenu();

  contextMessage = messageItem;

  messageMenu.style.left = `${Math.min(event.clientX, window.innerWidth - 164)}px`;
  messageMenu.style.top = `${Math.min(event.clientY, window.innerHeight - 80)}px`;
  messageMenu.classList.remove("hidden");
}

function closeMessageMenu() {
  messageMenu.classList.add("hidden");
  contextMessage = null;
}

function deleteMessageLocally(peerId, messageId) {
  const history = ensureChatHistory(peerId);
  const index = history.findIndex((msg) => msg.id === messageId);
  if (index !== -1) {
    history.splice(index, 1);
    if (activePeerId === peerId) {
      renderChatHistory();
    }
  }
}

function isKnownChatConnection(conn) {
  if (conn.type !== "data") {
    return false;
  }

  return conn.label === CHAT_LABEL || conn.metadata?.app === "Aero P2P Chat" || !conn.metadata;
}

function normalizeMessage(data) {
  if (!data || data.type !== "chat-message" || typeof data.text !== "string") {
    return null;
  }

  return {
    id: typeof data.id === "string" ? data.id : null,
    text: data.text.slice(0, MAX_MESSAGE_LENGTH),
    time: typeof data.time === "string" ? data.time : formatTime()
  };
}

function sendProtocolMessage(conn, type, extra = {}) {
  if (!conn?.open) {
    return false;
  }

  conn.send({
    type,
    protocol: PROTOCOL_VERSION,
    identityId: identity.id,
    nickname: identity.nickname || "",
    time: formatTime(),
    ...extra
  });
  return true;
}

function removePeer(peerId) {
  if (callState.peerId === peerId) {
    endVoiceCall({ notifyPeer: false, message: "Voice call ended." });
  }

  connections.delete(peerId);
  pendingConnections.delete(peerId);
  if (activePeerId === peerId) {
    activePeerId = connections.keys().next().value ?? null;
    renderChatHistory();
  }
}

function refreshPeers() {
  peerList.replaceChildren();

  if (connections.size === 0 && pendingConnections.size === 0) {
    if (contacts.length === 0) {
      const empty = document.createElement("span");
      empty.className = "empty-peer";
      empty.textContent = "No contacts yet";
      peerList.append(empty);
    }
    chatTitle.textContent = "Ready to connect";
    messageInput.disabled = true;
    sendButton.disabled = true;
    callChat.disabled = true;
    disconnectChat.disabled = true;
    renderChatHistory();
  }

  const visibleContactIds = new Set([
    ...connections.keys(),
    ...pendingConnections.keys()
  ]);

  for (const contact of getVisibleContacts()) {
    if (visibleContactIds.has(contact.id)) {
      continue;
    }

    const row = document.createElement("div");
    row.className = "contact-item";

    const name = document.createElement("button");
    name.type = "button";
    name.className = "contact-name";
    name.append(createContactBadges(contact));
    const label = document.createElement("span");
    label.className = "contact-label";
    label.textContent = contact.label;
    name.append(label);
    name.addEventListener("click", () => {
      connectToPeer(contact.id);
    });
    name.addEventListener("contextmenu", (event) => {
      openContactMenu(event, contact.id);
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "contact-remove";
    remove.title = "Remove contact";
    remove.setAttribute("aria-label", "Remove contact");
    remove.append(renderIcon("fa-solid fa-xmark"));
    remove.addEventListener("click", () => {
      removeContact(contact.id);
    });

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "contact-edit";
    edit.title = "Edit nickname";
    edit.setAttribute("aria-label", "Edit nickname");
    edit.append(renderIcon("fa-solid fa-pen"));
    edit.addEventListener("click", () => {
      openSettings(contact.id);
    });

    row.addEventListener("contextmenu", (event) => {
      openContactMenu(event, contact.id);
    });

    row.append(name, edit, remove);
    peerList.append(row);
  }

  for (const [peerId, entry] of pendingConnections) {
    const peerLabel = getPeerLabel(peerId, entry.conn);
    if (entry.direction === "incoming") {
      const row = document.createElement("div");
      row.className = "request-item";

      const name = document.createElement("span");
      const identityId = getPeerIdentityId(peerId, entry.conn);
      const contact = findContact(identityId);
      name.append(createContactBadges({
        pinned: Boolean(contact?.pinned),
        trusted: isTrusted(identityId),
        waiting: true
      }));
      const label = document.createElement("span");
      label.className = "contact-label";
      label.textContent = peerLabel;
      name.append(label);

      const actions = document.createElement("div");
      actions.className = "request-actions";

      const accept = document.createElement("button");
      accept.type = "button";
      accept.textContent = "Accept";
      accept.addEventListener("click", () => {
        acceptConnection(peerId);
      });

      const decline = document.createElement("button");
      decline.type = "button";
      decline.textContent = "Decline";
      decline.addEventListener("click", () => {
        declineConnection(peerId);
      });

      actions.append(accept, decline);
      row.append(name, actions);
      row.addEventListener("contextmenu", (event) => {
        openContactMenu(event, getPeerIdentityId(peerId, entry.conn));
      });
      peerList.append(row);
      continue;
    }

    const waiting = document.createElement("button");
    waiting.type = "button";
    waiting.className = "peer-chip pending";
    const identityId = getPeerIdentityId(peerId, entry.conn);
    const contact = findContact(identityId);
    waiting.append(createContactBadges({
      pinned: Boolean(contact?.pinned),
      trusted: isTrusted(identityId),
      waiting: true
    }));
    const label = document.createElement("span");
    label.className = "contact-label";
    label.textContent = peerLabel;
    waiting.append(label);
    waiting.setAttribute("aria-disabled", "true");
    waiting.addEventListener("contextmenu", (event) => {
      openContactMenu(event, getPeerIdentityId(peerId, entry.conn));
    });
    peerList.append(waiting);
  }

  for (const [peerId, conn] of connections) {
    const peerLabel = getPeerLabel(peerId, conn);
    const button = document.createElement("button");
    button.type = "button";
    button.className = peerId === activePeerId ? "peer-chip active" : "peer-chip";
    const identityId = getPeerIdentityId(peerId, conn);
    const contact = findContact(identityId);
    button.append(createContactBadges({
      pinned: Boolean(contact?.pinned),
      trusted: isTrusted(identityId),
      online: conn.open
    }));
    const label = document.createElement("span");
    label.className = "contact-label";
    label.textContent = conn.open ? peerLabel : `${peerLabel} ...`;
    button.append(label);
    const unread = unreadCounts.get(peerId) || 0;
    if (unread > 0) {
      const unreadBadge = document.createElement("span");
      unreadBadge.className = "unread-count";
      unreadBadge.textContent = unread > 99 ? "99+" : String(unread);
      button.append(unreadBadge);
    }
    button.addEventListener("click", () => {
      activePeerId = peerId;
      unreadCounts.delete(peerId);
      renderChatHistory();
      refreshPeers();
      messageInput.focus();
    });
    button.addEventListener("contextmenu", (event) => {
      openContactMenu(event, getPeerIdentityId(peerId, conn));
    });
    peerList.append(button);
  }

  const activeConn = activePeerId ? connections.get(activePeerId) : null;
  const canChat = Boolean(activeConn?.open);
  chatTitle.textContent = activePeerId ? `Connected to ${getPeerLabel(activePeerId, activeConn)}` : "Ready to connect";
  messageInput.disabled = !canChat;
  sendButton.disabled = !canChat;
  disconnectChat.disabled = !canChat;
  updateConnectButton();
  refreshCallUi();
  updateEmptyChatState();
}

function acceptConnection(peerId) {
  const entry = pendingConnections.get(peerId);
  if (!entry) {
    return;
  }

  const peerLabel = getPeerLabel(peerId, entry.conn);

  pendingConnections.delete(peerId);
  connections.set(peerId, entry.conn);
  activePeerId = peerId;

  if (entry.conn.open) {
    sendProtocolMessage(entry.conn, "connection-accepted");
    pinContact(getPeerIdentityId(peerId, entry.conn), getPeerLabel(peerId, entry.conn));
    setStatus("online", `Connected to ${peerLabel}`);
    renderChatHistory();
    addSystemMessage(`Connection with ${peerLabel} accepted.`);
    playConnectedSound();
    messageInput.focus();
  } else {
    entry.acceptOnOpen = true;
    pendingConnections.set(peerId, entry);
    connections.delete(peerId);
    setStatus("pending", `Accepting ${peerLabel}...`);
  }

  refreshPeers();
}

function declineConnection(peerId) {
  const entry = pendingConnections.get(peerId);
  if (!entry) {
    return;
  }

  const peerLabel = getPeerLabel(peerId, entry.conn);

  sendProtocolMessage(entry.conn, "connection-declined");
  entry.conn.close();
  pendingConnections.delete(peerId);
  setStatus(connections.size > 0 ? "online" : "pending", connections.size > 0 ? "Peer connected" : "Ready to connect");
  addSystemMessage(`Connection request from ${peerLabel} declined.`);
  refreshPeers();
}

function promoteOutgoingConnection(peerId) {
  const entry = pendingConnections.get(peerId);
  if (!entry) {
    return;
  }

  const peerLabel = getPeerLabel(peerId, entry.conn);

  pendingConnections.delete(peerId);
  connections.set(peerId, entry.conn);
  activePeerId = peerId;
  pinContact(getPeerIdentityId(peerId, entry.conn), peerLabel);
  setStatus("online", `Connected to ${peerLabel}`);
  renderChatHistory();
  addSystemMessage(`${peerLabel} accepted your request.`);
  playConnectedSound();
  messageInput.focus();
  refreshPeers();
}

function attachConnectionHandlers(conn, peerId) {
  const peerLabel = () => getPeerLabel(peerId, conn);

  conn.on("open", () => {
    const pending = pendingConnections.get(peerId);
    if (pending?.direction === "outgoing") {
      sendProtocolMessage(conn, "connection-request");
      setStatus("pending", `Waiting for ${peerLabel()} to accept...`);
      refreshPeers();
      return;
    }

    if (pending?.acceptOnOpen) {
      pendingConnections.delete(peerId);
      connections.set(peerId, conn);
      activePeerId = peerId;
      sendProtocolMessage(conn, "connection-accepted");
      pinContact(getPeerIdentityId(peerId, conn), peerLabel());
      setStatus("online", `Connected to ${peerLabel()}`);
      renderChatHistory();
      addSystemMessage(`Connection with ${peerLabel()} accepted.`);
      playConnectedSound();
      messageInput.focus();
      refreshPeers();
      return;
    }

    if (connections.has(peerId)) {
      setStatus("online", `Connected to ${peerLabel()}`);
      refreshPeers();
    }
  });

  conn.on("data", (data) => {
    rememberConnectionIdentity(peerId, data);

    if (data?.type === "connection-request") {
      refreshPeers();
      return;
    }

    if (data?.type === "connection-accepted") {
      promoteOutgoingConnection(peerId);
      return;
    }

    if (data?.type === "connection-declined") {
      pendingConnections.delete(peerId);
      conn.close();
      setStatus("offline", `${peerLabel()} declined your request.`);
      addSystemMessage(`${peerLabel()} declined your connection request.`);
      refreshPeers();
      return;
    }

    if (data?.type === "connection-closed") {
      conn.close();
      removePeer(peerId);
      setStatus(connections.size > 0 ? "online" : "pending", connections.size > 0 ? "Peer connected" : "Ready to connect");
      addSystemMessage(`${peerLabel()} disconnected.`);
      refreshPeers();
      return;
    }

    if (data?.type === "call-request") {
      handleIncomingCallRequest(peerId, data);
      return;
    }

    if (data?.type === "call-accepted") {
      handleCallAccepted(peerId, data);
      return;
    }

    if (data?.type === "call-declined") {
      handleCallDeclined(peerId, data);
      return;
    }

    if (data?.type === "call-ended") {
      handleRemoteCallEnded(peerId, data);
      return;
    }

    if (data?.type === "delete-message" && typeof data.messageId === "string") {
      deleteMessageLocally(peerId, data.messageId);
      return;
    }

    const message = normalizeMessage(data);
    if (!message || !connections.has(peerId)) {
      return;
    }

    addChatMessage({
      id: message.id,
      text: message.text,
      sender: "them",
      peerId,
      time: message.time
    });
    notifyIncomingMessage(peerId, message.text);
  });

  conn.on("close", () => {
    const wasKnown = connections.get(peerId) === conn || pendingConnections.get(peerId)?.conn === conn;
    if (!wasKnown) {
      return;
    }

    removePeer(peerId);
    addSystemMessage(`${peerLabel()} closed the connection.`);
    setStatus(connections.size > 0 ? "online" : "pending", connections.size > 0 ? "Peer connected" : "Ready to connect");
    refreshPeers();
  });

  conn.on("error", (error) => {
    setStatus("offline", `Connection error: ${error.message}`);
    addSystemMessage(`Error with ${peerLabel()}: ${error.message}`);
  });
}

function registerConnection(conn, options = {}) {
  const peerId = conn.peer;
  const direction = options.incoming ? "incoming" : "outgoing";
  if (direction === "incoming") {
    rememberConnectionIdentity(peerId, conn.metadata);
  }
  const peerIdentityId = getPeerIdentityId(peerId, conn);

  if (!isKnownChatConnection(conn)) {
    addSystemMessage(`Rejected unsupported connection from ${peerId}.`);
    conn.close();
    return;
  }

  if (direction === "incoming" && isBlocked(peerIdentityId)) {
    conn.close();
    setStatus(connections.size > 0 ? "online" : "pending", connections.size > 0 ? "Peer connected" : "Ready to connect");
    return;
  }

  if (connections.has(peerId)) {
    connections.get(peerId).close();
  }
  if (pendingConnections.has(peerId)) {
    pendingConnections.get(peerId).conn.close();
  }

  pendingConnections.set(peerId, { conn, direction });
  attachConnectionHandlers(conn, peerId);

  if (direction === "incoming") {
    if (isTrusted(peerIdentityId)) {
      acceptConnection(peerId);
      return;
    }

    setStatus("pending", `Connection request from ${getPeerLabel(peerId, conn)}`);
    addSystemMessage(`${getPeerLabel(peerId, conn)} wants to chat. Accept the request to start.`);
  } else {
    setStatus("pending", `Sending request to ${getPeerLabel(peerId, conn)}...`);
  }

  refreshPeers();
}

function connectToPeer(remoteId) {
  remoteId = normalizeAeroId(remoteId);

  if (!peer?.open) {
    setStatus("offline", "Your peer is not ready yet.");
    return;
  }

  if (!remoteId || remoteId === myPeerId) {
    setStatus("offline", "Please enter a different peer ID.");
    return;
  }

  const conn = peer.connect(remoteId, {
    label: CHAT_LABEL,
    metadata: createChatMetadata(),
    reliable: true,
    serialization: "json"
  });
  registerConnection(conn);
}

function renderBlockedList() {
  blockedList.replaceChildren();
  const blockedContacts = contacts.filter((contact) => contact.blocked);

  if (blockedContacts.length === 0) {
    const empty = document.createElement("span");
    empty.className = "empty-peer";
    empty.textContent = "No blocked users";
    blockedList.append(empty);
    return;
  }

  for (const contact of blockedContacts) {
    const row = document.createElement("div");
    row.className = "blocked-item";

    const name = document.createElement("span");
    name.textContent = contact.label;

    const unblock = document.createElement("button");
    unblock.type = "button";
    unblock.textContent = "Unblock";
    unblock.addEventListener("click", () => {
      setBlocked(contact.id, false);
      addSystemMessage(`${contact.label} unblocked.`);
    });

    row.append(name, unblock);
    blockedList.append(row);
  }
}

function renderContactNicknameList(focusContactId = "") {
  contactNicknameList.replaceChildren();
  const editableContacts = contacts.filter((contact) => !contact.blocked);

  if (editableContacts.length === 0) {
    const empty = document.createElement("span");
    empty.className = "empty-peer";
    empty.textContent = "No contacts yet";
    contactNicknameList.append(empty);
    return;
  }

  for (const contact of editableContacts) {
    const row = document.createElement("div");
    row.className = "contact-nickname-item";

    const details = document.createElement("div");
    details.className = "contact-nickname-details";

    const currentName = document.createElement("strong");
    currentName.textContent = contact.label;

    const id = document.createElement("code");
    id.textContent = contact.id;

    details.append(currentName, id);

    const editor = document.createElement("div");
    editor.className = "contact-nickname-editor";

    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 32;
    input.placeholder = contact.remoteNickname || "Nickname";
    input.value = contact.customLabel ? contact.label : "";
    input.dataset.contactId = contact.id;
    input.setAttribute("aria-label", `Nickname for ${contact.label}`);

    const save = document.createElement("button");
    save.type = "button";
    save.textContent = "Save";
    save.addEventListener("click", () => {
      setContactNickname(contact.id, input.value);
      addSystemMessage(`${findContact(contact.id)?.label || contact.id} nickname saved.`);
    });

    const clear = document.createElement("button");
    clear.type = "button";
    clear.title = "Clear nickname";
    clear.setAttribute("aria-label", "Clear nickname");
    clear.append(renderIcon("fa-solid fa-xmark"));
    clear.addEventListener("click", () => {
      input.value = "";
      setContactNickname(contact.id, "");
      addSystemMessage(`${contact.id} nickname cleared.`);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        save.click();
      }
    });

    editor.append(input, save, clear);
    row.append(details, editor);
    contactNicknameList.append(row);

  }
}

function openSettings(focusContactId = "") {
  nicknameInput.value = identity.nickname || "";
  refreshAudioDevices();
  renderAppSettings();
  renderAudioSettings();
  renderContactNicknameList(focusContactId);
  renderBlockedList();
  settingsModal.classList.remove("hidden");
  if (focusContactId) {
    requestAnimationFrame(() => {
      const input = contactNicknameList.querySelector(`[data-contact-id="${focusContactId}"]`);
      input?.focus();
      input?.select();
    });
  }
}

function createPeer() {
  if (!isSupportedDataChannel()) {
    ownId.textContent = "unsupported";
    setStatus("offline", "WebRTC DataChannels are not supported here.");
    addSystemMessage(`Unsupported WebRTC runtime: ${util.browser}`);
    return null;
  }

  const nextPeer = new Peer(identity.id, {
    debug: 1,
    config: peerConnectionConfig
  });

  nextPeer.on("open", (id) => {
    myPeerId = id;
    ownId.textContent = identity.id;
    setStatus("pending", "Aero ID ready. Share it with your chat partner.");
    updateConnectButton();
  });

  nextPeer.on("connection", (conn) => {
    registerConnection(conn, { incoming: true });
  });

  nextPeer.on("call", (mediaConn) => {
    handleIncomingMediaCall(mediaConn);
  });

  nextPeer.on("disconnected", () => {
    setStatus("offline", "Signaling disconnected. Reconnecting...");
    nextPeer.reconnect();
  });

  nextPeer.on("error", (error) => {
    if (error.type === "unavailable-id") {
      setStatus("offline", "This Aero ID is already online in another app window.");
      addSystemMessage("Close the other running instance or reset app data to create a new Aero ID.");
      return;
    }

    setStatus("offline", error.message);
    addSystemMessage(`PeerJS error: ${error.message}`);
  });

  nextPeer.on("close", () => {
    setStatus("offline", "Peer closed.");
  });

  return nextPeer;
}

copyId.addEventListener("click", async () => {
  if (!myPeerId) {
    return;
  }

  try {
    await writeClipboardText(identity.id);
    copyId.classList.add("copied");
    setStatus("pending", "Aero ID copied.");
    setTimeout(() => {
      copyId.classList.remove("copied");
    }, 1200);
  } catch {
    setStatus("offline", "Could not copy Aero ID.");
  }
});

connectForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const remoteId = normalizeAeroId(remoteIdInput.value);
  if (!isValidAeroId(remoteId)) {
    setStatus("offline", "Please enter a valid Aero ID.");
    return;
  }

  pinContact(remoteId);
  connectToPeer(remoteId);
  remoteIdInput.value = "";
  refreshPeers();
});

remoteIdInput.addEventListener("input", () => {
  const normalized = normalizeAeroId(remoteIdInput.value);
  if (remoteIdInput.value !== normalized) {
    remoteIdInput.value = normalized;
  }
  updateConnectButton();
});

messageForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = messageInput.value.trim();
  if (!text || !activePeerId) {
    return;
  }

  if (sendChatText(activePeerId, text)) {
    messageInput.value = "";
    messageInput.focus();
  }
});

clearChat.addEventListener("click", () => {
  if (activePeerId) {
    chatHistory.set(activePeerId, []);
  }
  renderChatHistory();
});

callChat.addEventListener("click", () => {
  startVoiceCall();
});

callAccept.addEventListener("click", () => {
  acceptVoiceCall();
});

callDecline.addEventListener("click", () => {
  declineVoiceCall();
});

callMute.addEventListener("click", () => {
  setCallMuted(!callState.muted);
});

callDeafen.addEventListener("click", () => {
  setCallDeafened(!callState.deafened);
});

callHangup.addEventListener("click", () => {
  endVoiceCall({ notifyPeer: true, message: "Voice call ended." });
});

disconnectChat.addEventListener("click", () => {
  if (!activePeerId) {
    return;
  }

  const conn = connections.get(activePeerId);
  const peerLabel = getPeerLabel(activePeerId, conn);
  conn?.close();
  removePeer(activePeerId);
  setStatus(connections.size > 0 ? "online" : "pending", connections.size > 0 ? "Peer connected" : "Ready to connect");
  addSystemMessage(`Disconnected from ${peerLabel}.`);
  refreshPeers();
});

microphoneSelect.addEventListener("change", () => {
  appConfig.audio.inputDeviceId = microphoneSelect.value || "default";
  saveAudioConfig();
});

speakerSelect.addEventListener("change", async () => {
  appConfig.audio.outputDeviceId = speakerSelect.value || "default";
  saveAudioConfig();
  await applyAudioOutputDevice();
});

micProfileSelect.addEventListener("change", () => {
  setMicProfile(micProfileSelect.value || "standard", { persist: true });
});

micModeSelect.addEventListener("change", () => {
  setMicMode(micModeSelect.value || "auto", { persist: true });
});

micSensitivitySlider.addEventListener("input", () => {
  setMicSensitivity(Number(micSensitivitySlider.value || 0));
});

micSensitivitySlider.addEventListener("change", () => {
  setMicSensitivity(Number(micSensitivitySlider.value || 0), { persist: true });
});

micNoiseReductionSlider.addEventListener("input", () => {
  setMicNoiseReduction(Number(micNoiseReductionSlider.value || 0));
});

micNoiseReductionSlider.addEventListener("change", () => {
  setMicNoiseReduction(Number(micNoiseReductionSlider.value || 0), { persist: true });
});

micBoostSlider.addEventListener("input", () => {
  setMicBoost(Number(micBoostSlider.value || 0));
});

micBoostSlider.addEventListener("change", () => {
  setMicBoost(Number(micBoostSlider.value || 0), { persist: true });
});

remoteVolumeSlider.addEventListener("input", () => {
  setRemoteVolume(Number(remoteVolumeSlider.value || 0));
});

remoteVolumeSlider.addEventListener("change", () => {
  setRemoteVolume(Number(remoteVolumeSlider.value || 0));
  saveAudioConfig();
});

autostartToggle.addEventListener("change", () => {
  saveAppSettings({ autostart: autostartToggle.checked });
});

autostartOpen.addEventListener("change", () => {
  if (autostartOpen.checked) {
    saveAppSettings({ startHidden: false });
  }
});

autostartHidden.addEventListener("change", () => {
  if (autostartHidden.checked) {
    saveAppSettings({ startHidden: true });
  }
});

closeToTrayToggle.addEventListener("change", () => {
  saveAppSettings({ closeToTray: closeToTrayToggle.checked });
});

notificationsToggle.addEventListener("change", () => {
  saveNotificationSettings({ enabled: notificationsToggle.checked });
});

messageNotificationsToggle.addEventListener("change", () => {
  saveNotificationSettings({ messages: messageNotificationsToggle.checked });
});

callNotificationsToggle.addEventListener("change", () => {
  saveNotificationSettings({ calls: callNotificationsToggle.checked });
});

focusedNotificationsToggle.addEventListener("change", () => {
  saveNotificationSettings({ showWhenFocused: focusedNotificationsToggle.checked });
});

soundsToggle.addEventListener("change", () => {
  saveSoundSettings({ enabled: soundsToggle.checked });
});

messageSoundToggle.addEventListener("change", () => {
  saveSoundSettings({ messages: messageSoundToggle.checked });
});

ringtoneSoundToggle.addEventListener("change", () => {
  saveSoundSettings({ ringtone: ringtoneSoundToggle.checked });
});

callEventSoundToggle.addEventListener("change", () => {
  saveSoundSettings({ callEvents: callEventSoundToggle.checked });
});

connectedSoundToggle.addEventListener("change", () => {
  saveSoundSettings({ connected: connectedSoundToggle.checked });
});

navigator.mediaDevices?.addEventListener?.("devicechange", () => {
  refreshAudioDevices();
});

window.aeroChat?.onNotificationAction?.((action) => {
  if (!action || typeof action !== "object") {
    return;
  }

  const peerId = String(action.peerId || "");
  if (action.type === "open" && connections.has(peerId)) {
    activePeerId = peerId;
    unreadCounts.delete(peerId);
    renderChatHistory();
    refreshPeers();
    messageInput.focus();
    return;
  }

  if (action.type === "reply" && connections.has(peerId)) {
    sendChatText(peerId, action.text);
    return;
  }

  if (action.type === "accept-call" && callState.status === "incoming" && callState.peerId === peerId) {
    activePeerId = peerId;
    unreadCounts.delete(peerId);
    renderChatHistory();
    refreshPeers();
    acceptVoiceCall();
    return;
  }

  if (action.type === "decline-call" && callState.status === "incoming" && callState.peerId === peerId) {
    declineVoiceCall();
  }
});

function openLinuxUpdateModal() {
  modalText.textContent = `Run this command to update Aero P2P Chat to version ${availableUpdate?.version ?? "latest"}.`;
  linuxCommand.textContent = linuxInstallCommand;
  updateModal.classList.remove("hidden");
}

function setUpdateButtonText(text) {
  updateButton.textContent = text;
  headerUpdateButton.textContent = text;
}

function startUpdateProgressListener() {
  removeUpdateProgressListener?.();
  removeUpdateProgressListener = window.aeroChat?.onUpdateProgress?.((progress) => {
    if (progress?.phase === "download") {
      const percentText = Number.isFinite(progress.percent) ? `${progress.percent}%` : "...";
      setUpdateButtonText(`Downloading ${percentText}`);
      setStatus("pending", `Downloading update ${percentText}`);
      return;
    }

    if (progress?.phase === "install") {
      setUpdateButtonText("Starting setup...");
      setStatus("pending", "Starting update setup...");
      return;
    }

    if (progress?.phase === "verify") {
      setUpdateButtonText("Verifying...");
      setStatus("pending", "Verifying update download...");
    }
  }) || null;
}

function stopUpdateProgressListener() {
  removeUpdateProgressListener?.();
  removeUpdateProgressListener = null;
}

async function installAvailableUpdate() {
  if (!availableUpdate) {
    window.open(latestReleaseUrl, "_blank", "noopener");
    return;
  }

  if (platform === "win32") {
    updateButton.disabled = true;
    headerUpdateButton.disabled = true;
    startUpdateProgressListener();
    setUpdateButtonText("Downloading 0%");
    setStatus("pending", "Downloading update installer...");

    try {
      await window.aeroChat.installUpdate({
        url: availableUpdate.windowsUrl,
        version: availableUpdate.version,
        sha256: availableUpdate.windowsSha256,
        sha512: availableUpdate.windowsSha512
      });
      setUpdateButtonText("Setup started");
      setStatus("pending", "Setup started. The app will restart.");
    } catch (error) {
      stopUpdateProgressListener();
      updateButton.disabled = false;
      headerUpdateButton.disabled = false;
      updateButton.textContent = "Install update";
      headerUpdateButton.textContent = "Update";
      setStatus("offline", error.message || "Update failed.");
    }
    return;
  }

  openLinuxUpdateModal();
}

headerUpdateButton.addEventListener("click", installAvailableUpdate);
updateButton.addEventListener("click", installAvailableUpdate);
appMenuUpdate.addEventListener("click", () => {
  installAvailableUpdate();
  closeAppMenu();
});

windowMinimize.addEventListener("click", () => {
  window.aeroChat?.windowControl?.("minimize");
});

windowMaximize.addEventListener("click", () => {
  window.aeroChat?.windowControl?.("maximize");
});

windowClose.addEventListener("click", () => {
  window.aeroChat?.windowControl?.("close");
});

modalClose.addEventListener("click", () => {
  updateModal.classList.add("hidden");
});

updateModal.addEventListener("click", (event) => {
  if (event.target === updateModal) {
    updateModal.classList.add("hidden");
  }
});

copyUpdateCommand.addEventListener("click", async () => {
  try {
    await writeClipboardText(linuxInstallCommand);
    copyUpdateCommand.textContent = "Copied";
    setTimeout(() => {
      copyUpdateCommand.textContent = "Copy command";
    }, 1200);
  } catch {
    copyUpdateCommand.textContent = "Copy failed";
    setTimeout(() => {
      copyUpdateCommand.textContent = "Copy command";
    }, 1200);
  }
});

titlebarLogo.addEventListener("contextmenu", openAppMenu);

titlebarLogo.addEventListener("click", openAppMenu);

appMenuSettings.addEventListener("click", () => {
  openSettings();
  closeAppMenu();
});

settingsClose.addEventListener("click", () => {
  settingsModal.classList.add("hidden");
});

settingsModal.addEventListener("click", (event) => {
  if (event.target === settingsModal) {
    settingsModal.classList.add("hidden");
  }
});

function saveOwnNickname() {
  identity.nickname = sanitizeNickname(nicknameInput.value);
  nicknameInput.value = identity.nickname;
  appConfig.identity = identity;
  saveAppConfig();
  setStatus("pending", identity.nickname ? `Nickname set to ${identity.nickname}.` : "Nickname cleared.");
}

saveNickname.addEventListener("click", saveOwnNickname);

nicknameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    saveOwnNickname();
  }
});

menuTrust.addEventListener("click", () => {
  if (!contextContactId) {
    return;
  }

  const nextValue = !isTrusted(contextContactId);
  setTrusted(contextContactId, nextValue);
  addSystemMessage(`${findContact(contextContactId)?.label || contextContactId} ${nextValue ? "trusted" : "untrusted"}.`);
  closeContactMenu();
});

menuPin.addEventListener("click", () => {
  if (!contextContactId) {
    return;
  }

  const nextValue = !findContact(contextContactId)?.pinned;
  setPinned(contextContactId, nextValue);
  addSystemMessage(`${contextContactId} ${nextValue ? "pinned" : "unpinned"}.`);
  closeContactMenu();
});

menuNickname.addEventListener("click", () => {
  if (!contextContactId) {
    return;
  }

  openSettings(contextContactId);
  closeContactMenu();
});

menuBlock.addEventListener("click", () => {
  if (!contextContactId) {
    return;
  }

  const nextValue = !isBlocked(contextContactId);
  setBlocked(contextContactId, nextValue);
  if (!nextValue) {
    addSystemMessage(`${contextContactId} unblocked.`);
  }
  closeContactMenu();
});

menuCopy.addEventListener("click", () => {
  if (!contextMessage) {
    return;
  }

  writeClipboardText(contextMessage.text).catch(() => {});
  closeMessageMenu();
});

menuDelete.addEventListener("click", () => {
  if (!contextMessage) {
    return;
  }

  const { id, sender, peerId } = contextMessage;

  if (sender === "me") {
    deleteMessageLocally(peerId, id);
    const conn = connections.get(peerId);
    if (conn) {
      sendProtocolMessage(conn, "delete-message", { messageId: id });
    }
  } else {
    deleteMessageLocally(peerId, id);
  }

  closeMessageMenu();
});

document.addEventListener("click", (event) => {
  if (!contactMenu.contains(event.target)) {
    closeContactMenu();
  }
  if (!appMenu.contains(event.target) && event.target !== titlebarLogo) {
    closeAppMenu();
  }
  if (!messageMenu.contains(event.target)) {
    closeMessageMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAppMenu();
    closeContactMenu();
    closeMessageMenu();
    updateModal.classList.add("hidden");
    settingsModal.classList.add("hidden");
  }
});

let realtimeCleanupStarted = false;

function cleanupRealtimeConnections({ deferClose = false } = {}) {
  if (realtimeCleanupStarted) {
    return;
  }

  realtimeCleanupStarted = true;
  endVoiceCall({ notifyPeer: true });

  const openConnections = Array.from(connections.values()).filter((conn) => conn?.open);
  const pendingEntries = Array.from(pendingConnections.values());
  for (const conn of openConnections) {
    sendProtocolMessage(conn, "connection-closed");
  }

  const closeAll = () => {
    for (const conn of connections.values()) {
      conn.close();
    }
    for (const entry of pendingEntries) {
      entry.conn.close();
    }
    connections.clear();
    pendingConnections.clear();
    peer?.destroy();
  };

  if (deferClose && openConnections.length > 0) {
    setTimeout(closeAll, 120);
  } else {
    closeAll();
  }
}

window.aeroChat?.onSystemShutdown?.(() => {
  cleanupRealtimeConnections({ deferClose: true });
});

window.addEventListener("beforeunload", () => {
  cleanupRealtimeConnections();
});

refreshPeers();
refreshAudioDevices();
setBootProgress(82, "Rendering chat");
peer = createPeer();
setBootProgress(90, "Starting peer");
checkForUpdates();

async function finishBootScreen() {
  await waitForVisualReady();
  setBootProgress(100, "Ready");

  requestAnimationFrame(() => {
    const logoRect = titlebarLogo.getBoundingClientRect();
    const bootRect = bootLogo?.getBoundingClientRect();
    const targetX = logoRect.left + logoRect.width / 2;
    const targetY = logoRect.top + logoRect.height / 2;
    const currentX = bootRect ? bootRect.left + bootRect.width / 2 : window.innerWidth / 2;
    const currentY = bootRect ? bootRect.top + bootRect.height / 2 : window.innerHeight / 2;

    document.body.style.setProperty("--boot-delta-x", `${targetX - currentX}px`);
    document.body.style.setProperty("--boot-delta-y", `${targetY - currentY}px`);
    document.body.classList.add("app-boot-finish");

    window.setTimeout(() => {
      document.body.classList.remove("app-loading", "app-boot-finish");
      document.body.style.removeProperty("--boot-delta-x");
      document.body.style.removeProperty("--boot-delta-y");
    }, 1040);
  });
}

finishBootScreen();
