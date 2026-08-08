// deno-lint-ignore-file no-window no-window-prefix no-unused-vars require-await
import Peer, { util } from "peerjs";
import emojiDataUrl from "../../node_modules/emoji-picker-element-data/de/cldr/data.json?url";
import emojiShortcodeDataUrl from "../../node_modules/emoji-picker-element-data/en/github/data.json?url";
import countryFlagEmojiFontUrl from "../../node_modules/country-flag-emoji-polyfill/dist/TwemojiCountryFlags.woff2?url";
import { getDomain } from "tldts";
import "@fortawesome/fontawesome-free/css/all.min.css";
import appLogo from "../../assets/app.png";
import packageInfo from "../../package.json" with { type: "json" };
import { createPlatformApi } from "./platform.js";
import "./design.css";

const projectConfig = __PROJECT_CONFIG__;

const titlebarLogo = document.querySelector("#titlebar-logo");
const titlebarUsername = document.querySelector("#titlebar-username");
const titlebarPresence = document.querySelector("#titlebar-presence");
const titlebarSubtitle = document.querySelector("#titlebar-subtitle");
const windowMinimize = document.querySelector("#window-minimize");
const windowMaximize = document.querySelector("#window-maximize");
const windowClose = document.querySelector("#window-close");
const ownId = document.querySelector("#own-id");
const ownIdPrivacyToggle = document.querySelector("#toggle-own-id-privacy");
const copyId = document.querySelector("#copy-id");
const connectForm = document.querySelector("#connect-form");
const remoteIdInput = document.querySelector("#remote-id");
const connectButton = document.querySelector("#connect-button");
const statusDot = document.querySelector("#status-dot");
const statusText = document.querySelector("#status-text");
const titlebarStatus = document.querySelector(".titlebar-status");
const retryConnectButton = document.querySelector("#retry-connect");
const appShell = document.querySelector(".app-shell");
const sidebarResizer = document.querySelector("#sidebar-resizer");
const contactSearchInput = document.querySelector("#contact-search");
const peerList = document.querySelector("#peer-list");
const feedbackButton = document.querySelector("#feedback-button");
const mobileFeedbackButton = document.querySelector("#feedback-button-mobile");
const chatTitle = document.querySelector("#chat-title");
const chatActions = document.querySelector(".chat-actions");
const callChat = document.querySelector("#call-chat");
const clearChat = document.querySelector("#clear-chat");
const disconnectChat = document.querySelector("#disconnect-chat");
const callBanner = document.querySelector("#call-banner");
const incomingCallScreen = document.querySelector("#incoming-call-screen");
const incomingCallName = document.querySelector("#incoming-call-name");
const screenCallAccept = document.querySelector("#screen-call-accept");
const screenCallDecline = document.querySelector("#screen-call-decline");
const screenCallIgnore = document.querySelector("#screen-call-ignore");
const callText = document.querySelector("#call-text");
const callPeerName = document.querySelector("#call-peer-name");
const callHealth = document.querySelector("#call-health");
const callAccept = document.querySelector("#call-accept");
const callDecline = document.querySelector("#call-decline");
const callMute = document.querySelector("#call-mute");
const callDeafen = document.querySelector("#call-deafen");
const callCamera = document.querySelector("#call-camera");
const callStream = document.querySelector("#call-stream");
const callHangup = document.querySelector("#call-hangup");
const callStage = document.querySelector("#call-stage");
const localParticipantCard = document.querySelector("#local-participant-card");
const remoteParticipantCard = document.querySelector(
  "#remote-participant-card",
);
const localVideo = document.querySelector("#local-video");
const remoteVideo = document.querySelector("#remote-video");
const localPipVideo = document.querySelector("#local-pip-video");
const remotePipVideo = document.querySelector("#remote-pip-video");
const localStreamFullscreen = document.querySelector(
  "#local-stream-fullscreen",
);
const remoteStreamFullscreen = document.querySelector(
  "#remote-stream-fullscreen",
);
const localParticipantName = document.querySelector("#local-participant-name");
const remoteParticipantName = document.querySelector(
  "#remote-participant-name",
);
const localParticipantStatus = document.querySelector(
  "#local-participant-status",
);
const remoteParticipantStatus = document.querySelector(
  "#remote-participant-status",
);
const localParticipantBadges = document.querySelector(
  "#local-participant-badges",
);
const remoteParticipantBadges = document.querySelector(
  "#remote-participant-badges",
);
const messages = document.querySelector("#messages");
const typingIndicator = document.querySelector("#typing-indicator");
const messageForm = document.querySelector("#message-form");
const messageInput = document.querySelector("#message-input");
const sendButton = document.querySelector("#send-button");
const voiceRecordButton = document.querySelector("#voice-record-button");
const emojiPickerButton = document.querySelector("#emoji-picker-button");
const emojiPickerPopover = document.querySelector("#emoji-picker-popover");
const emojiShortcodePopover = document.querySelector("#emoji-shortcode-popover");
const voiceRecordStatus = document.querySelector("#voice-record-status");
const headerUpdateButton = document.querySelector("#header-update-button");
const updateCard = document.querySelector("#update-card");
const offlineBanner = document.querySelector("#offline-banner");
const updateTitle = document.querySelector("#update-title");
const updateText = document.querySelector("#update-text");
const updateButton = document.querySelector("#update-button");
const updateIgnoreButton = document.querySelector("#update-ignore-button");
const updateModal = document.querySelector("#update-modal");
const startupUpdateModal = document.querySelector("#startup-update-modal");
const startupUpdateTitle = document.querySelector("#startup-update-title");
const startupUpdateText = document.querySelector("#startup-update-text");
const startupUpdateClose = document.querySelector("#startup-update-close");
const startupUpdateIgnoreButton = document.querySelector("#startup-update-ignore-button");
const startupUpdateButton = document.querySelector("#startup-update-button");
let startupUpdateModalShownForVersion = "";

const modalText = document.querySelector("#modal-text");
const modalClose = document.querySelector("#modal-close");
const linuxCommand = document.querySelector("#linux-command");
const linuxWebsiteCommand = document.querySelector("#linux-website-command");
const copyUpdateCommands = document.querySelectorAll(".copy-update-command");
const appDialog = document.querySelector("#app-dialog");
const appDialogTitle = document.querySelector("#app-dialog-title");
const appDialogMessage = document.querySelector("#app-dialog-message");
const appDialogClose = document.querySelector("#app-dialog-close");
const appDialogCancel = document.querySelector("#app-dialog-cancel");
const appDialogConfirm = document.querySelector("#app-dialog-confirm");
const appDialogCheckbox = document.querySelector("#app-dialog-checkbox");
const appDialogCheckboxInput = document.querySelector("#app-dialog-checkbox-input");
const appDialogCheckboxLabel = document.querySelector("#app-dialog-checkbox-label");
const appDialogLinkDetails = document.querySelector("#app-dialog-link-details");
const appDialogLinkUrl = document.querySelector("#app-dialog-link-url");
const appDialogLinkDomainValue = document.querySelector("#app-dialog-link-domain-value");
const welcomeScreen = document.querySelector("#welcome-screen");
const welcomeStepLabel = document.querySelector("#welcome-step-label");
const welcomePages = Array.from(
  document.querySelectorAll("[data-welcome-step]"),
).sort(
  (left, right) =>
    Number(left.dataset.welcomeStep) - Number(right.dataset.welcomeStep),
);
const welcomeProgress = Array.from(
  document.querySelectorAll("[data-welcome-progress]"),
);
const welcomeNickname = document.querySelector("#welcome-nickname");
const welcomeThemeSystem = document.querySelector("#welcome-theme-system");
const welcomeThemeLight = document.querySelector("#welcome-theme-light");
const welcomeThemeDark = document.querySelector("#welcome-theme-dark");
const welcomeAccentColorSelect = document.querySelector(
  "#welcome-accent-color-select",
);
const welcomeCustomAccentColorInput = document.querySelector(
  "#welcome-custom-accent-color",
);
const welcomeMicrophoneSelect = document.querySelector(
  "#welcome-microphone-select",
);
const welcomeCameraSelect = document.querySelector("#welcome-camera-select");
const welcomeSpeakerSelect = document.querySelector("#welcome-speaker-select");
const welcomeDetectDevices = document.querySelector("#welcome-detect-devices");
const welcomeDeviceStatus = document.querySelector("#welcome-device-status");
const welcomeAutostartToggle = document.querySelector(
  "#welcome-autostart-toggle",
);
const welcomeAutostartOpen = document.querySelector("#welcome-autostart-open");
const welcomeAutostartHidden = document.querySelector(
  "#welcome-autostart-hidden",
);
const welcomeAutostartModes = document.querySelector(
  "#welcome-autostart-modes",
);
const welcomeAutostartUnavailable = document.querySelector(
  "#welcome-autostart-unavailable",
);
const welcomeBack = document.querySelector("#welcome-back");
const welcomeNext = document.querySelector("#welcome-next");
const settingsModal = document.querySelector("#settings-modal");
const settingsClose = document.querySelector("#settings-close");
const settingsNavItems = Array.from(
  document.querySelectorAll("[data-settings-nav]"),
);
const settingsPages = Array.from(
  document.querySelectorAll("[data-settings-page]"),
);
const settingsContent = document.querySelector(".settings-grid");
let activeSettingsPage = "";
const resetAllSettingsButton = document.querySelector("#reset-all-settings");
const profileModal = document.querySelector("#profile-modal");
const profileClose = document.querySelector("#profile-close");
const profileAvatarPreview = document.querySelector("#profile-avatar-preview");
const profileId = document.querySelector("#profile-id");
const profileNickname = document.querySelector("#profile-nickname");
const profileAvatarTemplate = document.querySelector("#profile-avatar-template");
const profileTemplateToggle = document.querySelector("#profile-template-toggle");
const profileTemplateLabel = document.querySelector("#profile-template-label");
const profileTemplateOptions = document.querySelector("#profile-template-options");
const profileTemplateOptionButtons = Array.from(
  document.querySelectorAll("[data-avatar-template]"),
);
const profileAvatarColor = document.querySelector("#profile-avatar-color");
const profileAvatarColorValue = document.querySelector("#profile-avatar-color-value");
const profileColorField = profileAvatarColor.closest(".profile-color-field");
const profileAvatarDecoration = document.querySelector("#profile-avatar-decoration");
const profileAvatarInitial = document.querySelector("#profile-avatar-initial");
const profileNameFont = document.querySelector("#profile-name-font");
const profileNameThemeColor = document.querySelector("#profile-name-theme-color");
const profileNameColor = document.querySelector("#profile-name-color");
const profileNameColorValue = document.querySelector("#profile-name-color-value");
const profileNameColorField = profileNameColor.closest(".profile-color-field");
const profileNamePreviewLight = document.querySelector("#profile-name-preview-light");
const profileNamePreviewDark = document.querySelector("#profile-name-preview-dark");
const profileReset = document.querySelector("#profile-reset");
const profileSave = document.querySelector("#profile-save");
const themeLight = document.querySelector("#theme-light");
const themeDark = document.querySelector("#theme-dark");
const themeSystem = document.querySelector("#theme-system");
const accentColorSelect = document.querySelector("#accent-color-select");
const customAccentColorInput = document.querySelector("#custom-accent-color");
const messageDensitySelect = document.querySelector("#message-density-select");
const chatFontSizeSelect = document.querySelector("#chat-font-size-select");
const compactLayoutToggle = document.querySelector("#compact-layout-toggle");
const reduceMotionToggle = document.querySelector("#reduce-motion-toggle");
const resetSidebarWidthButton = document.querySelector("#reset-sidebar-width");
const localThemeList = document.querySelector("#local-theme-list");
const themeTabButtons = Array.from(document.querySelectorAll("[data-theme-tab]"));
const themePanels = Array.from(document.querySelectorAll("[data-theme-panel]"));
const onlineThemeUrlsInput = document.querySelector("#online-theme-urls");
const applyOnlineThemesButton = document.querySelector("#apply-online-themes");
const onlineThemeStatus = document.querySelector("#online-theme-status");
const openThemesFolderButton = document.querySelector("#open-themes-folder");
const reloadThemesButton = document.querySelector("#reload-themes");
const microphoneSelect = document.querySelector("#microphone-select");
const cameraSelect = document.querySelector("#camera-select");
const speakerSelect = document.querySelector("#speaker-select");
const micProfileSelect = document.querySelector("#mic-profile-select");
const voiceCustomControls = document.querySelector("#voice-custom-controls");
const micModeSelect = document.querySelector("#mic-mode-select");
const micSensitivitySlider = document.querySelector("#mic-sensitivity-slider");
const micSensitivityLabel = document.querySelector("#mic-sensitivity-label");
const micModeLabel = document.querySelector("#mic-mode-label");
const micNoiseReductionSlider = document.querySelector(
  "#mic-noise-reduction-slider",
);
const micNoiseReductionLabel = document.querySelector(
  "#mic-noise-reduction-label",
);
const micEqLowSlider = document.querySelector("#mic-eq-low-slider");
const micEqLowLabel = document.querySelector("#mic-eq-low-label");
const micEqMidSlider = document.querySelector("#mic-eq-mid-slider");
const micEqMidLabel = document.querySelector("#mic-eq-mid-label");
const micEqHighSlider = document.querySelector("#mic-eq-high-slider");
const micEqHighLabel = document.querySelector("#mic-eq-high-label");
const micEqLabel = document.querySelector("#mic-eq-label");
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
const messageNotificationsToggle = document.querySelector(
  "#message-notifications-toggle",
);
const callNotificationsToggle = document.querySelector(
  "#call-notifications-toggle",
);
const focusedNotificationsToggle = document.querySelector(
  "#focused-notifications-toggle",
);
const readReceiptsToggle = document.querySelector("#read-receipts-toggle");
const voiceAutoDownloadToggle = document.querySelector("#voice-auto-download-toggle");
const voiceWaveformToggle = document.querySelector("#voice-waveform-toggle");
const trustedDomainsStatus = document.querySelector("#trusted-domains-status");
const clearTrustedDomainsButton = document.querySelector("#clear-trusted-domains");
const trustedDefaultDomainsCount = document.querySelector("#trusted-default-domains-count");
const trustedDefaultDomainsList = document.querySelector("#trusted-default-domains-list");
const soundsToggle = document.querySelector("#sounds-toggle");
const messageSoundToggle = document.querySelector("#message-sound-toggle");
const ringtoneSoundToggle = document.querySelector("#ringtone-sound-toggle");
const callEventSoundToggle = document.querySelector("#call-event-sound-toggle");
const connectedSoundToggle = document.querySelector("#connected-sound-toggle");
const contactNicknameList = document.querySelector("#contact-nickname-list");
const blockedList = document.querySelector("#blocked-list");
const appMenu = document.querySelector("#app-menu");
const appMenuOnline = document.querySelector("#app-menu-online");
const appMenuDnd = document.querySelector("#app-menu-dnd");
const appMenuOffline = document.querySelector("#app-menu-offline");
const appMenuUpdate = document.querySelector("#app-menu-update");
const appMenuUpdateIgnore = document.querySelector("#app-menu-update-ignore");





const appMenuStatus = document.querySelector("#app-menu-status");
const appMenuSettings = document.querySelector("#app-menu-settings");
const appMenuProfile = document.querySelector("#app-menu-profile");

const contactMenu = document.querySelector("#contact-menu");
const menuTrust = document.querySelector("#menu-trust");
const menuPin = document.querySelector("#menu-pin");
const menuNickname = document.querySelector("#menu-nickname");
const menuBlock = document.querySelector("#menu-block");
const messageMenu = document.querySelector("#message-menu");
const menuCopy = document.querySelector("#menu-copy");
const menuDelete = document.querySelector("#menu-delete");
const participantMenu = document.querySelector("#participant-menu");
const participantVolumeSlider = document.querySelector(
  "#participant-volume-slider",
);
const participantVolumeValue = document.querySelector(
  "#participant-volume-value",
);
const participantToggleName = document.querySelector(
  "#participant-toggle-name",
);
const streamMenu = document.querySelector("#stream-menu");
const streamMenuQuality = document.querySelector("#stream-menu-quality");
const streamMenuSource = document.querySelector("#stream-menu-source");
const streamMenuAudio = document.querySelector("#stream-menu-audio");
const streamMenuWatch = document.querySelector("#stream-menu-watch");
const streamMenuFullscreen = document.querySelector("#stream-menu-fullscreen");
const streamMenuStop = document.querySelector("#stream-menu-stop");
const mobileTabContacts = document.querySelector("#mobile-tab-contacts");
const mobileTabChat = document.querySelector("#mobile-tab-chat");
const mobileTabSettings = document.querySelector("#mobile-tab-settings");
const streamModal = document.querySelector("#stream-modal");
const streamModalClose = document.querySelector("#stream-modal-close");
const streamQualitySelect = document.querySelector("#stream-quality-select");
const streamFpsSelect = document.querySelector("#stream-fps-select");
const streamAudioToggle = document.querySelector("#stream-audio-toggle");
const streamTabScreens = document.querySelector("#stream-tab-screens");
const streamTabWindows = document.querySelector("#stream-tab-windows");
const screenSourceList = document.querySelector("#screen-source-list");
const streamStartButton = document.querySelector("#stream-start-button");
const bootLogo = document.querySelector(".boot-logo");
const bootStatus = document.querySelector("#boot-status");
const bootProgressFill = document.querySelector("#boot-progress-fill");
const bootPercent = document.querySelector("#boot-percent");
const autoFitTextNodes = Array.from(
  document.querySelectorAll(".auto-fit-text"),
);

const connections = new Map();
const pendingConnections = new Map();
const chatHistory = new Map();
const unreadCounts = new Map();
const remoteIdentities = new Map();
const remoteReadReceiptsEnabled = new Map();
const pendingVoiceUploads = new Map();
const incomingVoiceTransfers = new Map();
const CHAT_LABEL = "aero-p2p-chat";
const PROTOCOL_VERSION = 1;
const AERO_ID_PATTERN = /^aero-(?:[a-f0-9]{16}|[a-f0-9]{32})$/;
const AVATAR_TEMPLATES = new Set(["unique", "solid", "gradient", "rings"]);
const AVATAR_DECORATIONS = new Set(["none", "sparkle", "crown", "orbit"]);
const PROFILE_NAME_FONTS = new Set(["modern", "rounded", "mono", "serif"]);
const IDENTITY_STORAGE_KEY = "aero-p2p-chat.identity.v1";
const CONTACTS_STORAGE_KEY = "aero-p2p-chat.contacts.v1";
const THEME_STORAGE_KEY = "aero-p2p-chat.theme";
const MAX_MESSAGE_LENGTH = 4000;
const HIGH_BUFFER_SIZE = 25;
const VOICE_AUDIO_BITRATE = 96000;
const VOICE_MESSAGE_BITRATE = 48000;
const VOICE_MESSAGE_MAX_BYTES = 10 * 1024 * 1024;
const VOICE_MESSAGE_MAX_DURATION_SECONDS = 180;
const VOICE_MESSAGE_CHUNK_BYTES = 32 * 1024;
const VOICE_MESSAGE_EXPIRY_MS = 15 * 60 * 1000;
const MAX_PENDING_VOICE_UPLOADS = 8;
const MAX_ACTIVE_VOICE_TRANSFERS = 3;
const VOICE_MESSAGE_MIME_TYPES = new Set([
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
]);
let voiceRecorder = null;
let voiceRecordingStream = null;
let voiceRecordingStartedAt = 0;
let voiceRecordingTimer = null;
let voiceRecordingPeerId = null;
let voiceRecordingPresenceTimer = null;
let voiceWaveformAudioContext = null;
const CALL_HEALTH_POLL_MS = 3000;
const CALL_MEDIA_DISCONNECTED_TIMEOUT_MS = 12000;
const CALL_MEDIA_STALE_TIMEOUT_MS = 45000;
const CALL_STATS_FAILURE_LIMIT = 4;
const CALL_PLACEHOLDER_VIDEO_FPS = 8;
const CALL_CAMERA_WIDTH = 640;
const CALL_CAMERA_HEIGHT = 640;
const CALL_CAMERA_MAX_FRAMERATE = 24;
const CALL_VIDEO_FIXED_MAX_BITRATE = 450000;
const CALL_VIDEO_MIN_BITRATE = 120000;
const CALL_VIDEO_QUALITY_POLL_MS = 4000;
const SCREEN_STREAM_MIN_BITRATE = 180000;
const SCREEN_STREAM_QUALITY_POLL_MS = 3000;
const SCREEN_STREAM_BUFFER_DELAY_SECONDS = 0.28;
const SCREEN_STREAM_PROFILES = {
  "480p": { label: "480p", height: 480, bitrate: 1100000 },
  "720p": { label: "720p", height: 720, bitrate: 2400000 },
  "1080p": { label: "1080p", height: 1080, bitrate: 4200000 },
  native: { label: "Native", height: 0, bitrate: 5200000 },
};
const SCREEN_STREAM_FPS_OPTIONS = [15, 30, 60];
const MAX_CHAT_HISTORY_ITEMS = 500;
const MESSAGE_SEND_INTERVAL_MS = 180;
const MAX_QUEUED_OUTGOING_MESSAGES = 20;
const INCOMING_MESSAGE_WINDOW_MS = 5000;
const MAX_INCOMING_MESSAGES_PER_WINDOW = 35;
const CONNECTION_HEARTBEAT_INTERVAL_MS = 5000;
const CONNECTION_HEARTBEAT_TIMEOUT_MS = 16000;
const CONNECT_ACTION_COOLDOWN_MS = 1200;
const CALL_ACTION_COOLDOWN_MS = 900;
const OUTGOING_CALL_TIMEOUT_MS = 45000;
const TYPING_IDLE_MS = 1800;
const TYPING_SEND_INTERVAL_MS = 1200;
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const DEFAULT_MIC_SENSITIVITY = 55;
const DEFAULT_MIC_BOOST = 100;
const DEFAULT_MIC_NOISE_REDUCTION = 55;
const DEFAULT_MIC_EQ_LOW = 0;
const DEFAULT_MIC_EQ_MID = 0;
const DEFAULT_MIC_EQ_HIGH = 0;
const DEFAULT_SIDEBAR_WIDTH = 360;
const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
const DEFAULT_THEME = systemThemeQuery.matches
  ? "dark"
  : "light";
const appearanceAccentStyle = document.createElement("style");
appearanceAccentStyle.id = "appearance-accent-style";
document.head.append(appearanceAccentStyle);
const customThemeStyle = document.createElement("style");
customThemeStyle.id = "custom-theme-style";
document.head.append(customThemeStyle);
let availableCustomThemes = [];
let customThemesPath = "";
let systemAccentColor = "#147fa6";
const MIN_SIDEBAR_WIDTH = 190;
const MAX_SIDEBAR_WIDTH = 360;
const MIN_CHAT_WIDTH = 320;
const RESIZER_WIDTH = 12;
const VOICE_METER_FFT = 2048;
const CONNECT_TIMEOUT_MS = 12000;
let activePeerId = null;
let myPeerId = "";
let peer = null;
let availableUpdate = null;
let ignoredUpdateVersion = "";
let updateCheckInFlight = false;
let updateMenuResetTimer = null;
let currentWelcomeStep = 0;
let contacts = [];
const connectionHeartbeats = new Map();
let contextContactId = "";
let contextMessage = null;
let contextParticipantTarget = null;
let contextStreamTarget = "";
let selectedScreenSource = null;
let availableScreenSources = [];
let activeStreamSourceTab = "screens";
let streamFullscreenTarget = "";
let removeUpdateProgressListener = null;
const remoteAudio = new Audio();
remoteAudio.autoplay = true;
remoteAudio.playsInline = true;
remoteAudio.volume = 1;
remoteAudio.preload = "auto";
remoteAudio.style.display = "none";
document.body.append(remoteAudio);
localPipVideo && (localPipVideo.muted = true);
remotePipVideo && (remotePipVideo.muted = true);
const callJoinAudio = new Audio("sound/call-join.ogg");
const callLeaveAudio = new Audio("sound/call-leave.ogg");
const connectedAudio = new Audio("sound/connected.ogg");
const messageAudio = new Audio("sound/message.ogg");
const ringtoneAudio = new Audio("sound/ringtone.ogg");
let notificationState = {
  appFocused: false,
  systemDnd: false,
};
callJoinAudio.preload = "auto";
callLeaveAudio.preload = "auto";
connectedAudio.preload = "auto";
messageAudio.preload = "auto";
ringtoneAudio.preload = "auto";
ringtoneAudio.loop = true;
let localVoiceAudioContext = null;
let voiceCaptureGeneration = 0;
let localVoiceMeterFrame = 0;
let localVoiceNoiseFloor = 0.01;
let localVoiceGateNode = null;
let localVoiceBoostNode = null;
let localVoiceEqLowNode = null;
let localVoiceEqMidNode = null;
let localVoiceEqHighNode = null;
let localVoiceHighpassNode = null;
let localVoiceCompressorNode = null;
let localVoiceAnalyserNode = null;
let localVoiceProcessingContext = null;
let localVoiceMeterBuffer = null;
let pendingVoiceSettingsReapply = null;
let localVoiceGateIsOpen = false;
let localVoiceGateHoldUntil = 0;
let remoteVoiceAudioContext = null;
let remoteVoiceAnalyserNode = null;
let remoteVoiceMeterFrame = 0;
let remoteVoiceMeterBuffer = null;
let remoteVoiceNoiseFloor = 0.008;
let remoteVoiceIsActive = false;
let outgoingCallTimeout = null;
let lastFailedConnectId = "";
const connectTimeouts = new Map();
const outgoingMessageQueues = new Map();
const outgoingMessageTimers = new Map();
const outgoingMessageNextSendAt = new Map();
const incomingMessageWindows = new Map();
const actionCooldowns = new Map();
const typingStates = new Map();
const typingTimers = new Map();
const voiceRecordingStates = new Map();
const voiceRecordingTimers = new Map();
const localTypingTimers = new Map();
const lastTypingSentAt = new Map();
let intentionalPeerDisconnect = false;
let suppressPeerCloseMessages = false;
const callState = {
  peerId: null,
  callId: "",
  status: "idle",
  mediaConn: null,
  incomingMediaConn: null,
  localStream: null,
  localCameraStream: null,
  localCameraEnabled: false,
  remoteStream: null,
  remoteCameraEnabled: false,
  videoQualityProfile: "medium",
  videoQualityMonitor: null,
  videoQualityLastStats: null,
  healthMonitor: null,
  healthLastStats: null,
  localAudioAvailable: true,
  localErrorMessage: "",
  acceptedIncomingCallId: "",
  muted: false,
  deafened: false,
  mutedBeforeDeafen: null,
  joined: false,
};
const screenShareState = {
  localMediaConn: null,
  remoteMediaConn: null,
  localStream: null,
  remoteStream: null,
  sourceId: "",
  sourceName: "",
  quality: "720p",
  fps: 30,
  audioEnabled: false,
  remoteAudioEnabled: false,
  viewerWatching: true,
  remoteViewerWatching: true,
  hiddenByViewer: false,
  qualityMonitor: null,
  qualityLastStats: null,
};
const remoteCallStatus = {
  muted: false,
  deafened: false,
};
const autoFitResizeObserver =
  typeof ResizeObserver === "function"
    ? new ResizeObserver((entries) => {
        for (const entry of entries) {
          fitTextToContainer(entry.target);
        }
      })
    : null;

function fitTextToContainer(element) {
  if (!element) {
    return;
  }

  const computedStyle = window.getComputedStyle(element);
  const maxSize =
    Number(element.dataset.fitMax) || parseFloat(computedStyle.fontSize) || 12;
  const minSize = Number(element.dataset.fitMin) || 7;
  element.style.fontSize = `${maxSize}px`;

  if (element.scrollWidth <= element.clientWidth || element.clientWidth <= 0) {
    return;
  }

  let low = minSize;
  let high = maxSize;
  let best = minSize;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    element.style.fontSize = `${mid}px`;
    if (element.scrollWidth <= element.clientWidth) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  element.style.fontSize = `${best}px`;
}

function refreshAutoFitText() {
  for (const element of autoFitTextNodes) {
    fitTextToContainer(element);
  }
}

function setupAutoFitText() {
  for (const element of autoFitTextNodes) {
    autoFitResizeObserver?.observe(element);
    fitTextToContainer(element);
  }
}

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
    document.fonts?.ready?.catch?.(() => {}) ?? Promise.resolve(),
  ]);
}

const bootSimulationSteps = [
  [4, "Loading logo"],
  [18, "Preparing interface"],
  [42, "Loading settings"],
  [55, "Loading identity"],
  [82, "Rendering chat"],
  [90, "Starting peer"],
  [100, "Ready"],
];

function setBootSimulation(enabled) {
  debugBootSimulation = Boolean(enabled);
  window.clearTimeout(bootSimulationTimer);
  bootSimulationTimer = null;

  if (!debugBootSimulation) {
    setBootProgress(100, "Ready");
    document.body.classList.remove("app-loading", "app-boot-finish");
    return;
  }

  document.body.classList.remove("app-boot-finish");
  document.body.classList.add("app-loading");

  let stepIndex = 0;
  const renderStep = () => {
    if (!debugBootSimulation) return;
    const [progress, label] = bootSimulationSteps[stepIndex];
    setBootProgress(progress, label);
    stepIndex = (stepIndex + 1) % bootSimulationSteps.length;
    bootSimulationTimer = window.setTimeout(renderStep, 620);
  };
  renderStep();
}

setBootProgress(4, "Loading logo");

titlebarLogo.src = appLogo;
await waitForImageReady(bootLogo);
setBootProgress(18, "Preparing interface");

const currentVersion = packageInfo.version;
const appDisplayName = projectConfig.app.name;
const githubRepo = projectConfig.repo;
const linuxTerminalCommandName =
  projectConfig.app.cliCommandName ||
  projectConfig.linux.commandName ||
  "aerop2p";
const githubRepoUrl = `https://github.com/${githubRepo}`;
const latestReleaseUrl = `${githubRepoUrl}/releases/latest`;
const latestManifestUrl = `${latestReleaseUrl}/download/latest.yml`;
const newsPageUrl = "https://zorblock.de/feedback";
const linuxInstallCommand = `${linuxTerminalCommandName} update`;
const linuxWebsiteUpdateCommand =
  "bash <(curl -fsSL https://zorblock.github.io/AeroP2Pchat/install.sh) update";
const linuxUpdateCommands = {
  installed: linuxInstallCommand,
  website: linuxWebsiteUpdateCommand,
};

function setTitlebarActionLabel(button, text) {
  button.querySelector(".titlebar-action-label").textContent = text;
  button.title = text;
  button.setAttribute("aria-label", text);
}
const platformApi = createPlatformApi();
const platform = platformApi.platform;
const mobileWebLayoutQuery = window.matchMedia(
  "(max-width: 820px), (hover: none) and (pointer: coarse)",
);
let networkOffline = navigator.onLine === false;
let debugOfflineMode = false;

let debugSimulateUpdate = false;
let debugBootSimulation = false;
let bootSimulationTimer = null;
function setDebugSimulateUpdate(enabled) {
  const nextEnabled = Boolean(enabled);
  if (debugSimulateUpdate === nextEnabled) {
    return;
  }
  debugSimulateUpdate = nextEnabled;
  checkForUpdates({ manual: true });
}


document.title = appDisplayName;
document.querySelectorAll("[data-app-name]").forEach((element) => {
  element.textContent = appDisplayName;
});
document.querySelectorAll("[data-app-template]").forEach((element) => {
  element.textContent = element.dataset.appTemplate.replace(
    "{name}",
    appDisplayName,
  );
});
document.querySelectorAll("[data-app-aria-template]").forEach((element) => {
  element.setAttribute(
    "aria-label",
    element.dataset.appAriaTemplate.replace("{name}", appDisplayName),
  );
});

function applyPlatformUi() {
  const usesMobileLayout =
    platformApi.isAndroid ||
    (platform === "web" && mobileWebLayoutQuery.matches);

  document.body.dataset.platform = platform;
  // The class controls only the touch-first layout. Native capabilities still
  // use platformApi.isAndroid, so a mobile browser remains a web client.
  document.body.classList.toggle("platform-android", usesMobileLayout);
  document.body.classList.toggle(
    "platform-electron",
    !usesMobileLayout &&
      (platformApi.isElectron ||
        platformApi.isChromeExtension ||
        platform === "web"),
  );

  document
    .querySelector(".window-controls")
    ?.classList.toggle("hidden", !platformApi.hasNativeWindowControls);

  for (const element of [
    autostartToggle?.closest(".settings-check"),
    autostartModeGroup,
    closeToTrayToggle?.closest(".settings-check"),
  ]) {
    element?.classList.toggle("hidden", !platformApi.hasDesktopIntegration);
  }

  autostartToggle
    ?.closest(".settings-section")
    ?.classList.toggle("hidden", !platformApi.hasDesktopIntegration);

  if (!platformApi.hasDesktopIntegration) {
    setTitlebarActionLabel(appMenuUpdate, "Open latest release");
  }
}

applyPlatformUi();
if (typeof mobileWebLayoutQuery.addEventListener === "function") {
  mobileWebLayoutQuery.addEventListener("change", applyPlatformUi);
} else {
  mobileWebLayoutQuery.addListener(applyPlatformUi);
}

function setMobileTab(tab) {
  const nextTab = ["contacts", "chat", "settings"].includes(tab)
    ? tab
    : "contacts";
  document.body.dataset.mobileTab = nextTab;

  for (const [button, value] of [
    [mobileTabContacts, "contacts"],
    [mobileTabChat, "chat"],
    [mobileTabSettings, "settings"],
  ]) {
    const active = value === nextTab;
    button?.classList.toggle("active", active);
    button?.setAttribute("aria-pressed", active ? "true" : "false");
  }

  if (nextTab === "settings") {
    openSettings();
  } else if (!settingsModal.classList.contains("hidden")) {
    settingsModal.classList.add("hidden");
  }
}

setMobileTab("contacts");

const peerConnectionConfig = {
  iceServers: [
    // Keep the ICE list simple and avoid Twilio's default STUN host, which can
    // spam the console when DNS resolution fails on some networks.
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 4,
  bundlePolicy: "balanced",
  rtcpMuxPolicy: "require",
  sdpSemantics: "unified-plan",
};
let appConfig = {};
let configSaveQueue = Promise.resolve();
const enhancedSelects = new Map();

async function loadAppConfig() {
  return platformApi.loadConfig();
}

function stripRetiredIdentityData(config) {
  let changed = false;
  const remove = (object, key) => {
    if (object && Object.hasOwn(object, key)) {
      delete object[key];
      changed = true;
    }
  };

  for (const key of ["loggedIn", "accountUserId", "authToken", "role"]) {
    remove(config?.identity, key);
  }
  for (const contact of config?.contacts || []) {
    remove(contact, "accountUserId");
  }
  for (const key of [
    "pendingTokenRevocation",
    "accountReloginRequired",
    "accountSecurityVersion",
  ]) {
    remove(config?.security, key);
  }
  return changed;
}

function saveAppConfig() {
  // Serialize immutable snapshots. Rapid UI changes must not let an older
  // asynchronous write overwrite a newer setting, especially on Android.
  const snapshot = JSON.parse(JSON.stringify(appConfig));
  configSaveQueue = configSaveQueue
    .catch(() => {})
    .then(() => platformApi.saveConfig(snapshot));
  return configSaveQueue.catch(() => {});
}

function enhanceNativeSelects() {
  for (const select of document.querySelectorAll("select")) {
    if (select.id === "profile-avatar-template" || enhancedSelects.has(select)) {
      continue;
    }
    enhanceNativeSelect(select);
  }
}

function enhanceNativeSelect(select) {
  const wrapper = document.createElement("div");
  wrapper.className = "aero-select";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "aero-select-toggle";
  toggle.setAttribute("aria-haspopup", "listbox");
  toggle.setAttribute("aria-expanded", "false");
  const label = document.createElement("span");
  const icon = document.createElement("i");
  icon.className = "fa-solid fa-chevron-down";
  icon.setAttribute("aria-hidden", "true");
  toggle.append(label, icon);
  const options = document.createElement("div");
  options.className = "aero-select-options hidden";
  options.setAttribute("role", "listbox");

  select.before(wrapper);
  wrapper.append(toggle, options, select);
  select.classList.add("native-select");
  select.setAttribute("aria-hidden", "true");

  const close = () => {
    options.classList.add("hidden");
    toggle.setAttribute("aria-expanded", "false");
    // Menus are temporarily portalled to <body> while open so their fixed
    // position is not offset by a modal's backdrop-filter containing block.
    if (options.parentElement !== wrapper) {
      wrapper.append(options);
    }
  };
  const positionOptions = () => {
    const rect = toggle.getBoundingClientRect();
    const gap = 6;
    const viewportPadding = 10;
    const preferredHeight = Math.min(196, options.scrollHeight || 196);
    const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
    const spaceAbove = rect.top - gap - viewportPadding;
    const opensUp =
      spaceBelow < Math.min(112, preferredHeight) && spaceAbove > spaceBelow;
    const availableSpace = Math.max(84, opensUp ? spaceAbove : spaceBelow);
    const height = Math.min(preferredHeight, availableSpace);
    const left = Math.max(
      viewportPadding,
      Math.min(rect.left, window.innerWidth - rect.width - viewportPadding),
    );

    options.classList.toggle("opens-up", opensUp);
    options.style.left = `${left}px`;
    options.style.width = `${rect.width}px`;
    options.style.maxHeight = `${height}px`;
    options.style.top = `${opensUp ? Math.max(viewportPadding, rect.top - gap - height) : rect.bottom + gap}px`;
  };
  const open = () => {
    for (const [otherSelect, entry] of enhancedSelects.entries()) {
      if (otherSelect !== select) entry.close();
    }
    document.body.append(options);
    options.classList.remove("hidden");
    toggle.setAttribute("aria-expanded", "true");
    positionOptions();
    options.querySelector('[aria-selected="true"]')?.scrollIntoView({
      block: "nearest",
    });
  };
  const render = () => {
    const selected = select.selectedOptions[0];
    label.textContent = selected?.textContent || "Select an option";
    toggle.disabled = select.disabled || select.options.length === 0;
    options.replaceChildren(
      ...Array.from(select.options, (option) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = option.textContent;
        button.disabled = option.disabled;
        button.setAttribute("role", "option");
        button.setAttribute(
          "aria-selected",
          option.value === select.value ? "true" : "false",
        );
        button.addEventListener("click", () => {
          select.value = option.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          close();
          toggle.focus();
        });
        return button;
      }),
    );
  };

  toggle.addEventListener("click", () => {
    if (toggle.disabled) return;
    if (options.classList.contains("hidden")) {
      open();
      options.querySelector('[aria-selected="true"]')?.focus();
    } else {
      close();
    }
  });
  toggle.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (options.classList.contains("hidden")) open();
      const selected = options.querySelector('[aria-selected="true"]');
      selected?.focus();
    }
  });
  options.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      toggle.focus();
    }
  });
  select.addEventListener("change", render);
  new MutationObserver(render).observe(select, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["disabled"],
  });
  enhancedSelects.set(select, {
    wrapper,
    options,
    close,
    render,
    positionOptions,
  });
  render();
}

function syncEnhancedSelect(select) {
  enhancedSelects.get(select)?.render();
}

function syncEnhancedSelects() {
  for (const { render } of enhancedSelects.values()) {
    render();
  }
}

document.addEventListener("pointerdown", (event) => {
  for (const { wrapper, options, close } of enhancedSelects.values()) {
    if (!wrapper.contains(event.target) && !options.contains(event.target)) {
      close();
    }
  }
});

function positionOpenSelectMenus() {
  for (const { options, positionOptions } of enhancedSelects.values()) {
    if (!options.classList.contains("hidden")) {
      positionOptions();
    }
  }
}

window.addEventListener("resize", positionOpenSelectMenus);
document.addEventListener("scroll", positionOpenSelectMenus, true);

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

function normalizeAvatarConfig(value) {
  const template = AVATAR_TEMPLATES.has(value?.template)
    ? value.template
    : "unique";
  const color = /^#[a-f0-9]{6}$/i.test(String(value?.color || ""))
    ? String(value.color).toLowerCase()
    : "#4f46e5";
  const decoration = AVATAR_DECORATIONS.has(value?.decoration)
    ? value.decoration
    : "none";
  return {
    template,
    color,
    decoration,
    showInitial: value?.showInitial !== false,
  };
}

function normalizeNameStyle(value) {
  const font = PROFILE_NAME_FONTS.has(value?.font) ? value.font : "modern";
  const providedColor = /^#[a-f0-9]{6}$/i.test(String(value?.color || ""))
    ? String(value.color).toLowerCase()
    : "";
  const useThemeColor =
    value?.useThemeColor === true ||
    (value?.useThemeColor === undefined &&
      (!providedColor || providedColor === "#ffffff"));
  return {
    font,
    color: useThemeColor ? "" : providedColor || "#ffffff",
    useThemeColor,
  };
}

function loadIdentity() {
  if (appConfig.identity?.id && isValidAeroId(appConfig.identity.id)) {
    appConfig.identity.nickname = sanitizeNickname(appConfig.identity.nickname);
    appConfig.identity.avatar = normalizeAvatarConfig(appConfig.identity.avatar);
    appConfig.identity.nameStyle = normalizeNameStyle(appConfig.identity.nameStyle);
    appConfig.identity.previousIds = getKnownPreviousIdentityIds(
      appConfig.identity.previousIds,
      appConfig.identity.id,
    ).filter((id) => id !== appConfig.identity.id);
    return appConfig.identity;
  }

  const identity = {
    id: createIdentityId(),
    nickname: "",
    avatar: normalizeAvatarConfig(),
    nameStyle: normalizeNameStyle(),
    previousIds: [],
    createdAt: new Date().toISOString(),
  };
  appConfig.identity = identity;
  saveAppConfig();
  return identity;
}

function migrateLocalStorageConfig() {
  let changed = false;

  try {
    const storedIdentity = JSON.parse(
      localStorage.getItem(IDENTITY_STORAGE_KEY) || "null",
    );
    if (
      !appConfig.identity &&
      storedIdentity?.id &&
      isValidAeroId(storedIdentity.id)
    ) {
      appConfig.identity = storedIdentity;
      changed = true;
    }
  } catch {
    localStorage.removeItem(IDENTITY_STORAGE_KEY);
  }

  try {
    const storedContacts = JSON.parse(
      localStorage.getItem(CONTACTS_STORAGE_KEY) || "null",
    );
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

enhanceNativeSelects();
appConfig = await loadAppConfig();
if (stripRetiredIdentityData(appConfig)) {
  await saveAppConfig();
}
normalizeAppSettings();
applyAppearancePreferences();
await refreshCustomThemes();
setBootProgress(42, "Loading settings");
migrateLocalStorageConfig();
if (stripRetiredIdentityData(appConfig)) {
  await saveAppConfig();
}
normalizeAppSettings();
applyAppearancePreferences();
void refreshSystemAccentColor();
const identity = loadIdentity();
setBootProgress(55, "Loading identity");

ownId.textContent = identity.id;
  updateTitlebarLogo();
  normalizeAudioConfig();
applySidebarWidth(appConfig.appSettings.sidebarWidth);
renderAudioSettings();
setupSidebarResizer();
setupAutoFitText();

function isValidAeroId(value) {
  return AERO_ID_PATTERN.test(String(value || "").trim());
}

function normalizeAeroId(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getKnownPreviousIdentityIds(value, ownId = "") {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map(normalizeAeroId)
        .filter((id) => isValidAeroId(id) && id !== ownId),
    ),
  ];
}

async function writeClipboardText(text) {
  await platformApi.writeClipboard(text);
}

function showAppDialog({
  title = "Confirm",
  message = "",
  confirmText = "OK",
  cancelText = "Cancel",
  danger = false,
  checkboxLabel = "",
  linkDetails = null,
} = {}) {
  const previousFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  appDialogTitle.textContent = title;
  appDialogMessage.textContent = message;
  appDialogConfirm.textContent = confirmText;
  appDialogCancel.textContent = cancelText;
  appDialogConfirm.classList.toggle("danger", Boolean(danger));
  appDialogCheckboxInput.checked = false;
  appDialogCheckboxLabel.textContent = checkboxLabel;
  appDialogCheckbox.classList.toggle("hidden", !checkboxLabel);
  appDialog.classList.toggle("link-confirmation", Boolean(linkDetails));
  appDialogLinkDetails.classList.toggle("hidden", !linkDetails);
  appDialogLinkUrl.textContent = linkDetails?.url || "";
  appDialogLinkDomainValue.textContent = linkDetails?.domain || "";
  appDialog.classList.remove("hidden");

  return new Promise((resolve) => {
    let settled = false;

    const cleanup = (result) => {
      if (settled) {
        return;
      }

      settled = true;
      appDialog.classList.add("hidden");
      const checkboxChecked = appDialogCheckboxInput.checked;
      appDialogConfirm.classList.remove("danger");
      appDialog.classList.remove("link-confirmation");
      appDialogCheckbox.classList.add("hidden");
      appDialogCheckboxInput.checked = false;
      appDialog.removeEventListener("click", handleBackdrop);
      document.removeEventListener("keydown", handleKeydown, true);
      appDialogClose.removeEventListener("click", cancel);
      appDialogCancel.removeEventListener("click", cancel);
      appDialogConfirm.removeEventListener("click", confirm);
      previousFocus?.focus?.();
      resolve(checkboxLabel ? { confirmed: result, checkboxChecked } : result);
    };

    const confirm = () => cleanup(true);
    const cancel = () => cleanup(false);
    const handleBackdrop = (event) => {
      if (event.target === appDialog) {
        cancel();
      }
    };
    const handleKeydown = (event) => {
      if (appDialog.classList.contains("hidden")) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        cancel();
      }
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        confirm();
      }
    };

    appDialog.addEventListener("click", handleBackdrop);
    document.addEventListener("keydown", handleKeydown, true);
    appDialogClose.addEventListener("click", cancel);
    appDialogCancel.addEventListener("click", cancel);
    appDialogConfirm.addEventListener("click", confirm);
    appDialogConfirm.focus();
  });
}

function sanitizeNickname(value) {
  return String(value || "")
    .trim()
    .slice(0, 32);
}

function loadContacts() {
  if (!Array.isArray(appConfig.contacts)) {
    return [];
  }

  return appConfig.contacts
    .filter(
      (contact) => isValidAeroId(contact?.id) && contact.id !== identity.id,
    )
    .map((contact) => ({
      id: contact.id,
      label: contact.label || contact.id,
      remoteNickname: sanitizeNickname(contact.remoteNickname),
      customLabel: Boolean(contact.customLabel),
      pinned: contact.pinned !== false,
      trusted: Boolean(contact.trusted),
      blocked: Boolean(contact.blocked),
      playbackVolume: Number.isFinite(contact.playbackVolume)
        ? Math.max(0, Math.min(150, Math.round(contact.playbackVolume)))
        : 100,
      showVideoName: contact.showVideoName !== false,
      pinnedAt: contact.pinnedAt || new Date().toISOString(),
      avatar: normalizeAvatarConfig(contact.avatar),
      nameStyle: normalizeNameStyle(contact.nameStyle),
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

  appConfig.audio.inputDeviceId =
    typeof appConfig.audio.inputDeviceId === "string"
      ? appConfig.audio.inputDeviceId
      : "default";
  appConfig.audio.cameraDeviceId =
    typeof appConfig.audio.cameraDeviceId === "string"
      ? appConfig.audio.cameraDeviceId
      : "default";
  appConfig.audio.outputDeviceId =
    typeof appConfig.audio.outputDeviceId === "string"
      ? appConfig.audio.outputDeviceId
      : "default";
  appConfig.audio.remoteVolume = Number.isFinite(appConfig.audio.remoteVolume)
    ? Math.max(0, Math.min(100, Math.round(appConfig.audio.remoteVolume)))
    : 100;
  appConfig.audio.micMode =
    appConfig.audio.micMode === "manual" ? "manual" : "auto";
  appConfig.audio.micSensitivity = Number.isFinite(
    appConfig.audio.micSensitivity,
  )
    ? Math.max(0, Math.min(100, Math.round(appConfig.audio.micSensitivity)))
    : DEFAULT_MIC_SENSITIVITY;
  appConfig.audio.micBoost = Number.isFinite(appConfig.audio.micBoost)
    ? Math.max(0, Math.min(200, Math.round(appConfig.audio.micBoost)))
    : DEFAULT_MIC_BOOST;
  appConfig.audio.micNoiseReduction = Number.isFinite(
    appConfig.audio.micNoiseReduction,
  )
    ? Math.max(0, Math.min(100, Math.round(appConfig.audio.micNoiseReduction)))
    : DEFAULT_MIC_NOISE_REDUCTION;
  appConfig.audio.micEqLow = Number.isFinite(appConfig.audio.micEqLow)
    ? Math.round(Math.max(-12, Math.min(12, appConfig.audio.micEqLow)))
    : DEFAULT_MIC_EQ_LOW;
  appConfig.audio.micEqMid = Number.isFinite(appConfig.audio.micEqMid)
    ? Math.round(Math.max(-12, Math.min(12, appConfig.audio.micEqMid)))
    : DEFAULT_MIC_EQ_MID;
  appConfig.audio.micEqHigh = Number.isFinite(appConfig.audio.micEqHigh)
    ? Math.round(Math.max(-12, Math.min(12, appConfig.audio.micEqHigh)))
    : DEFAULT_MIC_EQ_HIGH;
  appConfig.audio.micProfile = ["voice-isolation", "studio", "custom"].includes(
    appConfig.audio.micProfile,
  )
    ? appConfig.audio.micProfile
    : "voice-isolation";
}

function saveAudioConfig() {
  normalizeAudioConfig();
  renderAudioSettings();
  saveAppConfig();
}

function scheduleVoiceSettingsReapply() {
  if (!callState.localStream || callState.status === "idle") {
    return;
  }

  if (pendingVoiceSettingsReapply) {
    clearTimeout(pendingVoiceSettingsReapply);
  }

  pendingVoiceSettingsReapply = setTimeout(() => {
    pendingVoiceSettingsReapply = null;
    applyVoiceSettingsToActiveCall().catch(() => {});
  }, 220);
}

function applyLiveVoiceSettingsToActiveStream() {
  if (!localVoiceProcessingContext) {
    return false;
  }

  normalizeAudioConfig();
  const now = localVoiceProcessingContext.currentTime;
  const profile = appConfig.audio.micProfile;
  const noiseReductionFactor = getMicNoiseReductionFactor();
  const eq = getMicEqValues();

  if (localVoiceHighpassNode) {
    const frequency =
      profile === "voice-isolation" ? 85 : 70 + noiseReductionFactor * 30;
    localVoiceHighpassNode.frequency.setTargetAtTime(frequency, now, 0.04);
  }
  if (localVoiceEqLowNode) {
    localVoiceEqLowNode.gain.setTargetAtTime(eq.low, now, 0.03);
  }
  if (localVoiceEqMidNode) {
    localVoiceEqMidNode.gain.setTargetAtTime(eq.mid, now, 0.03);
  }
  if (localVoiceEqHighNode) {
    localVoiceEqHighNode.gain.setTargetAtTime(eq.high, now, 0.03);
  }
  if (localVoiceBoostNode) {
    localVoiceBoostNode.gain.setTargetAtTime(getMicBoostGain(), now, 0.03);
  }
  if (localVoiceCompressorNode) {
    const threshold =
      profile === "voice-isolation" ? -26 : -22 - noiseReductionFactor * 5;
    const knee = profile === "voice-isolation" ? 20 : 16;
    const ratio =
      profile === "voice-isolation" ? 2.8 : 2.2 + noiseReductionFactor;
    localVoiceCompressorNode.threshold.setTargetAtTime(threshold, now, 0.05);
    localVoiceCompressorNode.knee.setTargetAtTime(knee, now, 0.05);
    localVoiceCompressorNode.ratio.setTargetAtTime(ratio, now, 0.05);
  }

  return true;
}

function setRemoteVolume(volume, { persist = true } = {}) {
  normalizeAudioConfig();
  const nextVolume = Math.max(0, Math.min(100, Math.round(volume)));
  if (persist) {
    appConfig.audio.remoteVolume = nextVolume;
  }
  remoteAudio.volume = nextVolume / 100;
  if (remoteVolumeSlider) {
    remoteVolumeSlider.value = String(
      persist ? nextVolume : appConfig.audio.remoteVolume,
    );
  }
  if (remoteVolumeLabel) {
    remoteVolumeLabel.textContent = `${persist ? nextVolume : appConfig.audio.remoteVolume}%`;
  }
  updateRangeFill(
    remoteVolumeSlider,
    persist ? nextVolume : appConfig.audio.remoteVolume,
    0,
    100,
  );
}

function getPeerPlaybackVolume(peerId = callState.peerId) {
  const identityId = peerId
    ? getPeerIdentityId(peerId, connections.get(peerId))
    : "";
  return Number.isFinite(findContact(identityId)?.playbackVolume)
    ? Math.max(
        0,
        Math.min(150, Math.round(findContact(identityId).playbackVolume)),
      )
    : 100;
}

function setPeerPlaybackVolume(peerId, volume) {
  const identityId = peerId
    ? getPeerIdentityId(peerId, connections.get(peerId))
    : "";
  if (!identityId) {
    return;
  }

  const nextVolume = Math.max(0, Math.min(150, Math.round(volume)));
  upsertContact(identityId, { playbackVolume: nextVolume, pinned: true });
  if (callState.peerId === peerId) {
    setRemoteVolume(nextVolume, { persist: false });
  }
}

function isOwnVideoNameVisible() {
  if (!appConfig.callUi || typeof appConfig.callUi !== "object") {
    appConfig.callUi = {};
  }
  return appConfig.callUi.showOwnVideoName !== false;
}

function setOwnVideoNameVisible(visible) {
  if (!appConfig.callUi || typeof appConfig.callUi !== "object") {
    appConfig.callUi = {};
  }
  appConfig.callUi.showOwnVideoName = visible !== false;
  saveAppConfig();
}

function isPeerVideoNameVisible(peerId = callState.peerId) {
  const identityId = peerId
    ? getPeerIdentityId(peerId, connections.get(peerId))
    : "";
  if (!identityId) {
    return true;
  }
  return findContact(identityId)?.showVideoName !== false;
}

function setPeerVideoNameVisible(peerId, visible) {
  const identityId = peerId
    ? getPeerIdentityId(peerId, connections.get(peerId))
    : "";
  if (!identityId) {
    return;
  }

  upsertContact(identityId, { showVideoName: visible !== false, pinned: true });
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
  updateRangeFill(micSensitivitySlider, nextValue, 0, 100);
  if (persist) {
    saveAudioConfig();
  }
  applyLiveVoiceSettingsToActiveStream();
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
  updateRangeFill(micBoostSlider, nextValue, 0, 200);
  if (persist) {
    saveAudioConfig();
  }
  applyLiveVoiceSettingsToActiveStream();
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
  updateRangeFill(micNoiseReductionSlider, nextValue, 0, 100);
  if (persist) {
    saveAudioConfig();
  }
  applyLiveVoiceSettingsToActiveStream();
}

function setMicEqBand(band, value, { persist = false } = {}) {
  normalizeAudioConfig();
  const nextValue = Math.max(-12, Math.min(12, Math.round(value)));
  const key =
    band === "low" ? "micEqLow" : band === "mid" ? "micEqMid" : "micEqHigh";
  appConfig.audio[key] = nextValue;
  const slider =
    band === "low"
      ? micEqLowSlider
      : band === "mid"
        ? micEqMidSlider
        : micEqHighSlider;
  const label =
    band === "low"
      ? micEqLowLabel
      : band === "mid"
        ? micEqMidLabel
        : micEqHighLabel;
  if (slider) {
    slider.value = String(nextValue);
  }
  if (label) {
    label.textContent = `${nextValue > 0 ? "+" : ""}${nextValue} dB`;
  }
  updateRangeFill(slider, nextValue, -12, 12);
  if (persist) {
    saveAudioConfig();
  }
  applyLiveVoiceSettingsToActiveStream();
}

function setMicMode(mode, { persist = false } = {}) {
  normalizeAudioConfig();
  appConfig.audio.micMode = mode === "manual" ? "manual" : "auto";
  if (micModeSelect) {
    micModeSelect.value = appConfig.audio.micMode;
    syncEnhancedSelect(micModeSelect);
  }
  if (persist) {
    saveAudioConfig();
  }
  applyLiveVoiceSettingsToActiveStream();
}

function setMicProfile(profile, { persist = false } = {}) {
  normalizeAudioConfig();
  appConfig.audio.micProfile = ["voice-isolation", "studio", "custom"].includes(
    profile,
  )
    ? profile
    : "voice-isolation";
  if (micProfileSelect) {
    micProfileSelect.value = appConfig.audio.micProfile;
    syncEnhancedSelect(micProfileSelect);
  }
  if (persist) {
    saveAudioConfig();
  }
  scheduleVoiceSettingsReapply();
}

function renderAudioSettings() {
  normalizeAudioConfig();
  if (micProfileSelect) {
    micProfileSelect.value = appConfig.audio.micProfile;
    syncEnhancedSelect(micProfileSelect);
  }
  const isCustom = appConfig.audio.micProfile === "custom";
  if (micModeSelect) {
    micModeSelect.value = appConfig.audio.micMode;
    micModeSelect.disabled = !isCustom;
    syncEnhancedSelect(micModeSelect);
  }
  if (micSensitivitySlider) {
    micSensitivitySlider.value = String(appConfig.audio.micSensitivity);
    micSensitivitySlider.disabled =
      !isCustom || appConfig.audio.micMode === "auto";
  }
  if (micSensitivityLabel) {
    micSensitivityLabel.textContent = `${appConfig.audio.micSensitivity}%`;
  }
  if (micBoostSlider) {
    micBoostSlider.value = String(appConfig.audio.micBoost);
    micBoostSlider.disabled = false;
  }
  if (micBoostLabel) {
    micBoostLabel.textContent = `${appConfig.audio.micBoost}%`;
  }
  if (micNoiseReductionSlider) {
    micNoiseReductionSlider.value = String(appConfig.audio.micNoiseReduction);
    micNoiseReductionSlider.disabled = !isCustom;
  }
  if (micNoiseReductionLabel) {
    micNoiseReductionLabel.textContent = `${appConfig.audio.micNoiseReduction}%`;
  }
  if (micEqLowSlider) {
    micEqLowSlider.value = String(appConfig.audio.micEqLow);
  }
  if (micEqMidSlider) {
    micEqMidSlider.value = String(appConfig.audio.micEqMid);
  }
  if (micEqHighSlider) {
    micEqHighSlider.value = String(appConfig.audio.micEqHigh);
  }
  if (micEqLowLabel) {
    micEqLowLabel.textContent = `${appConfig.audio.micEqLow > 0 ? "+" : ""}${appConfig.audio.micEqLow} dB`;
  }
  if (micEqMidLabel) {
    micEqMidLabel.textContent = `${appConfig.audio.micEqMid > 0 ? "+" : ""}${appConfig.audio.micEqMid} dB`;
  }
  if (micEqHighLabel) {
    micEqHighLabel.textContent = `${appConfig.audio.micEqHigh > 0 ? "+" : ""}${appConfig.audio.micEqHigh} dB`;
  }
  if (micEqLabel) {
    const eqValues = [
      appConfig.audio.micEqLow,
      appConfig.audio.micEqMid,
      appConfig.audio.micEqHigh,
    ];
    micEqLabel.textContent = eqValues.every((value) => value === 0)
      ? "Flat"
      : "Custom";
  }
  if (micModeLabel) {
    micModeLabel.textContent =
      appConfig.audio.micMode === "manual" ? "Manual" : "Auto";
  }
  if (voiceCustomControls) {
    voiceCustomControls.classList.toggle("hidden", !isCustom);
  }
  if (remoteVolumeSlider) {
    remoteVolumeSlider.value = String(appConfig.audio.remoteVolume);
  }
  if (remoteVolumeLabel) {
    remoteVolumeLabel.textContent = `${appConfig.audio.remoteVolume}%`;
  }
  remoteAudio.volume = appConfig.audio.remoteVolume / 100;
  updateRangeFill(micSensitivitySlider, appConfig.audio.micSensitivity, 0, 100);
  updateRangeFill(
    micNoiseReductionSlider,
    appConfig.audio.micNoiseReduction,
    0,
    100,
  );
  updateRangeFill(micEqLowSlider, appConfig.audio.micEqLow, -12, 12);
  updateRangeFill(micEqMidSlider, appConfig.audio.micEqMid, -12, 12);
  updateRangeFill(micEqHighSlider, appConfig.audio.micEqHigh, -12, 12);
  syncEnhancedSelects();
  updateRangeFill(micBoostSlider, appConfig.audio.micBoost, 0, 200);
  updateRangeFill(remoteVolumeSlider, appConfig.audio.remoteVolume, 0, 100);
}

function updateRangeFill(input, value, min, max) {
  if (!input) {
    return;
  }

  const lower = Number.isFinite(min) ? min : 0;
  const upper = Number.isFinite(max) ? max : 100;
  const safeValue = Math.max(lower, Math.min(upper, Number(value) || 0));
  const span = Math.max(1, upper - lower);
  const percent = ((safeValue - lower) / span) * 100;
  input.style.setProperty("--range-fill", `${percent}%`);
}

function normalizeAppSettings() {
  if (!appConfig.appSettings || typeof appConfig.appSettings !== "object") {
    appConfig.appSettings = {};
  }

  appConfig.appSettings = {
    ...appConfig.appSettings,
    welcomeScreen: appConfig.appSettings.welcomeScreen !== false,
    autostart: appConfig.appSettings.autostart !== false,
    startHidden: appConfig.appSettings.startHidden !== false,
    closeToTray: appConfig.appSettings.closeToTray !== false,
    readReceipts: appConfig.appSettings.readReceipts !== false,
    voiceAutoDownload: Boolean(appConfig.appSettings.voiceAutoDownload),
    voiceWaveform: appConfig.appSettings.voiceWaveform !== false,
    trustedLinkDomains: Array.isArray(appConfig.appSettings.trustedLinkDomains)
      ? [...new Set(appConfig.appSettings.trustedLinkDomains
          .map(normalizeTrustedLinkDomain)
          .filter(Boolean))].slice(0, 100)
      : [],
    presenceStatus: ["online", "dnd", "offline"].includes(
      appConfig.appSettings.presenceStatus,
    )
      ? appConfig.appSettings.presenceStatus
      : "online",
    theme: ["system", "light", "dark"].includes(appConfig.appSettings.theme)
      ? appConfig.appSettings.theme
      : "system",
    accentColor: ["system", "aero", "violet", "green", "rose", "amber", "custom"].includes(
      appConfig.appSettings.accentColor,
    )
      ? appConfig.appSettings.accentColor
      : "system",
    customAccentColor: /^#[0-9a-f]{6}$/i.test(appConfig.appSettings.customAccentColor)
      ? appConfig.appSettings.customAccentColor
      : "#147fa6",
    hideOwnId: appConfig.appSettings.hideOwnId !== false,
    compactLayout: Boolean(appConfig.appSettings.compactLayout),
    messageDensity: ["comfortable", "compact"].includes(
      appConfig.appSettings.messageDensity,
    )
      ? appConfig.appSettings.messageDensity
      : "comfortable",
    chatFontSize: ["small", "normal", "large"].includes(
      appConfig.appSettings.chatFontSize,
    )
      ? appConfig.appSettings.chatFontSize
      : "normal",
    reducedMotion: Boolean(appConfig.appSettings.reducedMotion),
    customTheme:
      typeof appConfig.appSettings.customTheme === "string"
        ? appConfig.appSettings.customTheme
        : "",
    onlineThemeUrls: Array.isArray(appConfig.appSettings.onlineThemeUrls)
      ? [...new Set(appConfig.appSettings.onlineThemeUrls
          .map((value) => {
            try {
              const url = new URL(String(value || "").trim());
              return url.protocol === "https:" && !url.username && !url.password
                ? url.toString()
                : "";
            } catch {
              return "";
            }
          })
          .filter(Boolean))].slice(0, 8)
      : [],
    sidebarWidth: Number.isFinite(appConfig.appSettings.sidebarWidth)
      ? appConfig.appSettings.sidebarWidth
      : DEFAULT_SIDEBAR_WIDTH,
  };

  appConfig.appSettings.sidebarWidth = Math.round(
    Math.max(
      MIN_SIDEBAR_WIDTH,
      Math.min(MAX_SIDEBAR_WIDTH, appConfig.appSettings.sidebarWidth),
    ),
  );

  if (
    !appConfig.notificationSettings ||
    typeof appConfig.notificationSettings !== "object"
  ) {
    appConfig.notificationSettings = {};
  }
  appConfig.notificationSettings = {
    ...appConfig.notificationSettings,
    enabled: appConfig.notificationSettings.enabled !== false,
    messages: appConfig.notificationSettings.messages !== false,
    calls: appConfig.notificationSettings.calls !== false,
    showWhenFocused: Boolean(appConfig.notificationSettings.showWhenFocused),
  };

  if (!appConfig.soundSettings || typeof appConfig.soundSettings !== "object") {
    appConfig.soundSettings = {};
  }
  appConfig.soundSettings = {
    enabled: appConfig.soundSettings.enabled !== false,
    messages: appConfig.soundSettings.messages !== false,
    ringtone: appConfig.soundSettings.ringtone !== false,
    callEvents: appConfig.soundSettings.callEvents !== false,
    connected: appConfig.soundSettings.connected !== false,
  };

  if (!appConfig.appSettings.autostart) {
    appConfig.appSettings.startHidden = false;
  }
}

function resolveAppTheme(theme = "system") {
  if (theme === "system") {
    return systemThemeQuery.matches ? "dark" : "light";
  }
  return theme === "dark" ? "dark" : "light";
}

function applyAppTheme(theme = "system") {
  const nextTheme = resolveAppTheme(theme);
  document.documentElement.dataset.theme = nextTheme;
  document.body.dataset.theme = nextTheme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch {
    // The active platform config remains the source of truth if storage is blocked.
  }
  void platformApi.setSystemTheme(nextTheme);
}

const accentColors = {
  aero: "#147fa6",
  violet: "#7654d9",
  green: "#21875a",
  rose: "#c44d6d",
  amber: "#ad721c",
};

function getAccentForeground(color) {
  const channels = String(color || "")
    .replace(/^#/, "")
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);
  if (!channels || channels.length !== 3 || channels.some(Number.isNaN)) {
    return "#ffffff";
  }
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );
  const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
  const blackContrast = (luminance + 0.05) / 0.05;
  const whiteContrast = 1.05 / (luminance + 0.05);
  return blackContrast >= whiteContrast ? "#050505" : "#ffffff";
}

function applyAccentColor(accentColor = "system") {
  const color =
    accentColor === "system"
      ? systemAccentColor
      : accentColor === "custom"
      ? appConfig.appSettings?.customAccentColor || accentColors.aero
      : accentColors[accentColor] || accentColors.aero;
  const foreground = getAccentForeground(color);
  document.documentElement.style.setProperty("--boot-fill", color);
  document.documentElement.dataset.accentColor = accentColor;
  document.body.dataset.accentColor = accentColor;
  appearanceAccentStyle.textContent = `:root[data-accent-color], body[data-accent-color] { --accent: ${color}; --accent-hover: color-mix(in srgb, ${color} 84%, black); --accent-pressed: color-mix(in srgb, ${color} 70%, black); --accent-soft: color-mix(in srgb, ${color} 13%, transparent); --accent-soft-hover: color-mix(in srgb, ${color} 20%, transparent); --accent-ring: color-mix(in srgb, ${color} 26%, transparent); --line-accent: color-mix(in srgb, ${color} 48%, var(--line)); --on-accent: ${foreground}; }`;
}

function applyAppearancePreferences() {
  const settings = appConfig.appSettings || {};
  applyAppTheme(settings.theme);
  applyAccentColor(settings.accentColor);
  document.body.dataset.compactLayout = settings.compactLayout ? "true" : "false";
  document.body.dataset.messageDensity = settings.messageDensity || "comfortable";
  document.body.dataset.chatFontSize = settings.chatFontSize || "normal";
  document.body.classList.toggle("reduce-motion", Boolean(settings.reducedMotion));
}

async function refreshSystemAccentColor() {
  const result = await platformApi.getSystemAccentColor();
  if (typeof result?.color === "string" && /^#[0-9a-f]{6}$/i.test(result.color)) {
    systemAccentColor = result.color;
  }
  if (appConfig.appSettings?.accentColor === "system") {
    applyAccentColor("system");
  }
}

function handleSystemThemeChange() {
  if (appConfig.appSettings?.theme === "system") {
    applyAppTheme("system");
  }
  void refreshSystemAccentColor();
}

if (typeof systemThemeQuery.addEventListener === "function") {
  systemThemeQuery.addEventListener("change", handleSystemThemeChange);
} else {
  systemThemeQuery.addListener(handleSystemThemeChange);
}

function renderCustomThemePicker() {
  if (!customThemeSelect || !customThemeDetails) return;
  openThemesFolderButton?.classList.toggle("hidden", !platformApi.isElectron);
  reloadThemesButton?.classList.toggle("hidden", !platformApi.isElectron);
  const selectedTheme = appConfig.appSettings?.customTheme || "";
  customThemeSelect.replaceChildren(
    new Option("Default Aero theme", ""),
    ...availableCustomThemes.map((theme) => new Option(theme.name, theme.id)),
  );
  customThemeSelect.value = availableCustomThemes.some(
    (theme) => theme.id === selectedTheme,
  )
    ? selectedTheme
    : "";

  const activeTheme = availableCustomThemes.find(
    (theme) => theme.id === customThemeSelect.value,
  );
  if (activeTheme) {
    const details = [activeTheme.description, activeTheme.author && `by ${activeTheme.author}`, activeTheme.version && `v${activeTheme.version}`]
      .filter(Boolean)
      .join(" · ");
    customThemeDetails.textContent = details || activeTheme.id;
  } else if (platformApi.isElectron) {
    customThemeDetails.textContent = customThemesPath
      ? `Add .css files to ${customThemesPath}, then reopen Settings.`
      : "Loading themes…";
  } else {
    customThemeSelect.disabled = true;
    customThemeDetails.textContent =
      "Custom CSS themes are available in the desktop app.";
  }
  syncEnhancedSelect(customThemeSelect);
}

function renderLocalThemes() {
  if (!localThemeList) return;
  const selectedTheme = appConfig.appSettings?.customTheme || "";
  openThemesFolderButton?.classList.toggle("hidden", !platformApi.isElectron);
  reloadThemesButton?.classList.toggle("hidden", !platformApi.isElectron);
  const themes = platformApi.isElectron ? availableCustomThemes : [];
  const cards = [
    { id: "", name: "Default Aero theme", description: "Use Aero P2P Chat without a local CSS theme." },
    ...themes,
  ];
  localThemeList.replaceChildren(
    ...cards.map((theme) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "local-theme-card";
      const active = theme.id === selectedTheme;
      card.classList.toggle("active", active);
      card.setAttribute("aria-pressed", active ? "true" : "false");
      const title = document.createElement("strong");
      title.textContent = theme.name;
      const details = document.createElement("span");
      details.textContent = [theme.author && `by ${theme.author}`, theme.version && `v${theme.version}`, theme.description]
        .filter(Boolean)
        .join(" · ") || "Local CSS theme";
      card.append(title, details);
      card.addEventListener("click", async () => {
        if (await applyAllThemes(theme.id)) {
          saveAppSettings({ customTheme: theme.id });
        }
      });
      return card;
    }),
  );
}

function normalizeOnlineThemeUrls(value) {
  return [...new Set(String(value || "").split(/\r?\n/).map((line) => {
    try {
      const url = new URL(line.trim());
      return url.protocol === "https:" && !url.username && !url.password
        ? url.toString()
        : "";
    } catch {
      return "";
    }
  }).filter(Boolean))].slice(0, 8);
}

const allowedThemeAssetHosts = [
  "github.com",
  "githubusercontent.com",
  "gitlab.com",
  "codeberg.org",
  "imgur.com",
  "discord.com",
  "discordapp.com",
  "discordapp.net",
  "googleapis.com",
  "gstatic.com",
];

function isAllowedThemeAssetUrl(value) {
  const raw = String(value || "").trim();
  if (/^(data:|blob:|#)/i.test(raw)) return true;
  try {
    const url = new URL(raw);
    return (
      url.protocol === "https:" &&
      allowedThemeAssetHosts.some(
        (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
      )
    );
  } catch {
    return false;
  }
}

function sanitizeThemeCss(css) {
  return String(css || "")
    .replace(/@import\s+[^;]+;/gi, "")
    .replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (match, _quote, url) =>
      isAllowedThemeAssetUrl(url) ? match : "url(\"\")",
    );
}

async function applyAllThemes(localThemeId = appConfig.appSettings?.customTheme || "") {
  let localCss = "";
  if (localThemeId && platformApi.isElectron) {
    const result = await platformApi.loadTheme(localThemeId);
    if (!result?.ok) return false;
    localCss = sanitizeThemeCss(result.css);
  }

  const onlineUrls = appConfig.appSettings?.onlineThemeUrls || [];
  const onlineResults = await Promise.allSettled(
    onlineUrls.map((url) => platformApi.fetchOnlineTheme(url)),
  );
  const onlineCss = onlineResults
    .filter((result) => result.status === "fulfilled")
    .map((result) => sanitizeThemeCss(result.value));
  customThemeStyle.textContent = [localCss, ...onlineCss].filter(Boolean).join("\n\n");
  if (onlineThemeStatus) {
    const failed = onlineResults.filter((result) => result.status === "rejected").length;
    onlineThemeStatus.textContent = onlineUrls.length
      ? `${onlineCss.length} online theme${onlineCss.length === 1 ? "" : "s"} loaded${failed ? `, ${failed} failed` : ""}.`
      : "";
  }
  return true;
}

function selectThemeTab(tab = "local") {
  for (const button of themeTabButtons) {
    const active = button.dataset.themeTab === tab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  }
  for (const panel of themePanels) {
    panel.classList.toggle("hidden", panel.dataset.themePanel !== tab);
  }
}

async function applyCustomTheme(themeId) {
  if (!themeId) {
    customThemeStyle.textContent = "";
    return true;
  }
  const result = await platformApi.loadTheme(themeId);
  if (!result?.ok) {
    customThemeStyle.textContent = "";
    return false;
  }
  customThemeStyle.textContent = result.css;
  return true;
}

async function refreshCustomThemes() {
  if (platformApi.isElectron) {
    try {
      const result = await platformApi.listThemes();
      availableCustomThemes = Array.isArray(result?.themes) ? result.themes : [];
      customThemesPath = typeof result?.path === "string" ? result.path : "";
    } catch {
      availableCustomThemes = [];
    }
  }
  renderLocalThemes();
  await applyAllThemes();
}

function renderWelcomeSettings() {
  if (!welcomeScreen) {
    return;
  }

  const settings = appConfig.appSettings || {};
  welcomeThemeSystem.checked = settings.theme === "system";
  welcomeThemeLight.checked = settings.theme === "light";
  welcomeThemeDark.checked = settings.theme === "dark";
  welcomeAccentColorSelect.value = settings.accentColor;
  welcomeCustomAccentColorInput.value = settings.customAccentColor;
  welcomeCustomAccentColorInput.classList.toggle(
    "hidden",
    settings.accentColor !== "custom",
  );
  syncEnhancedSelect(welcomeAccentColorSelect);
  welcomeAutostartToggle.checked = Boolean(settings.autostart);
  welcomeAutostartToggle.disabled = !platformApi.supportsAutostart;
  welcomeAutostartOpen.checked = !settings.startHidden;
  welcomeAutostartHidden.checked = Boolean(settings.startHidden);

  const disableAutostartModes =
    !platformApi.supportsAutostart || !settings.autostart;
  welcomeAutostartOpen.disabled = disableAutostartModes;
  welcomeAutostartHidden.disabled = disableAutostartModes;
  welcomeAutostartModes.classList.toggle("disabled", disableAutostartModes);
  welcomeAutostartUnavailable.classList.toggle(
    "hidden",
    platformApi.supportsAutostart,
  );
}

function renderWelcomeStep() {
  const lastStep = welcomePages.length - 1;
  currentWelcomeStep = Math.max(0, Math.min(lastStep, currentWelcomeStep));

  for (const [index, page] of welcomePages.entries()) {
    page.classList.toggle("hidden", index !== currentWelcomeStep);
  }
  for (const [index, progress] of welcomeProgress.entries()) {
    progress.classList.toggle("active", index <= currentWelcomeStep);
  }

  welcomeStepLabel.textContent = `Step ${currentWelcomeStep + 1} of ${welcomePages.length}`;
  welcomeBack.disabled = currentWelcomeStep === 0;
  welcomeNext.querySelector("span").textContent =
    currentWelcomeStep === lastStep ? "Finish" : "Continue";

  requestAnimationFrame(() => {
    const focusTarget =
      welcomePages[currentWelcomeStep]?.querySelector(
        "input:not(:disabled), select:not(:disabled), button:not(:disabled)",
      );
    focusTarget?.focus();
  });
}

function openWelcomeScreen() {
  if (!appConfig.appSettings?.welcomeScreen) {
    return;
  }

  currentWelcomeStep = 0;
  welcomeNickname.value = identity.nickname || "";
  renderWelcomeSettings();
  renderWelcomeStep();
  welcomeScreen.classList.remove("hidden");
  void refreshAudioDevices();
}

async function finishWelcomeSetup() {
  await saveAppSettings({ welcomeScreen: false });
  welcomeScreen.classList.add("hidden");
  remoteIdInput.focus();
}

async function saveWelcomeNickname() {
  identity.nickname = sanitizeNickname(welcomeNickname.value);
  welcomeNickname.value = identity.nickname;
  appConfig.identity = identity;
  await saveAppConfig();
  return true;
}

async function detectWelcomeDevices() {
  welcomeDetectDevices.disabled = true;
  welcomeDeviceStatus.textContent = "Requesting microphone and camera access...";
  let permissionStream = null;
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Media device access is unavailable.");
    }
    permissionStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    welcomeDeviceStatus.textContent = "Devices detected. Choose the ones you want to use.";
  } catch {
    welcomeDeviceStatus.textContent =
      "Device access was not granted. You can continue with the default devices.";
  } finally {
    for (const track of permissionStream?.getTracks?.() || []) {
      track.stop();
    }
    await refreshAudioDevices();
    welcomeDetectDevices.disabled = false;
  }
}

function renderAppSettings() {
  normalizeAppSettings();
  if (!platformApi.supportsAutostart) {
    appConfig.appSettings.autostart = false;
    appConfig.appSettings.startHidden = false;
  }
  if (!platformApi.supportsCloseToTray) {
    appConfig.appSettings.closeToTray = false;
  }
  applyAppearancePreferences();
  const ownIdHidden = Boolean(appConfig.appSettings.hideOwnId);
  ownId.classList.toggle("is-private", ownIdHidden);
  ownId.setAttribute("aria-label", ownIdHidden ? "Aero ID hidden" : "Your Aero ID");
  ownIdPrivacyToggle.setAttribute(
    "aria-label",
    ownIdHidden ? "Show Aero ID" : "Hide Aero ID",
  );
  ownIdPrivacyToggle.title = ownIdPrivacyToggle.getAttribute("aria-label");
  ownIdPrivacyToggle.querySelector("i").className = ownIdHidden
    ? "fa-regular fa-eye-slash"
    : "fa-regular fa-eye";
  applySidebarWidth(appConfig.appSettings.sidebarWidth);
  updatePresenceMenuState();
  updateTitlebarPresenceIndicator();
  themeSystem.checked = appConfig.appSettings.theme === "system";
  themeLight.checked = appConfig.appSettings.theme === "light";
  themeDark.checked = appConfig.appSettings.theme === "dark";
  accentColorSelect.value = appConfig.appSettings.accentColor;
  customAccentColorInput.value = appConfig.appSettings.customAccentColor;
  customAccentColorInput.classList.toggle(
    "hidden",
    appConfig.appSettings.accentColor !== "custom",
  );
  messageDensitySelect.value = appConfig.appSettings.messageDensity;
  chatFontSizeSelect.value = appConfig.appSettings.chatFontSize;
  compactLayoutToggle.checked = appConfig.appSettings.compactLayout;
  reduceMotionToggle.checked = appConfig.appSettings.reducedMotion;
  syncEnhancedSelect(accentColorSelect);
  syncEnhancedSelect(messageDensitySelect);
  syncEnhancedSelect(chatFontSizeSelect);
  renderLocalThemes();
  if (onlineThemeUrlsInput && document.activeElement !== onlineThemeUrlsInput) {
    onlineThemeUrlsInput.value = (appConfig.appSettings.onlineThemeUrls || []).join("\n");
  }
  autostartToggle.checked = appConfig.appSettings.autostart;
  autostartOpen.checked = !appConfig.appSettings.startHidden;
  autostartHidden.checked = appConfig.appSettings.startHidden;
  autostartOpen.disabled = !appConfig.appSettings.autostart;
  autostartHidden.disabled = !appConfig.appSettings.autostart;
  autostartModeGroup.classList.toggle(
    "disabled",
    !appConfig.appSettings.autostart,
  );
  closeToTrayToggle.checked = appConfig.appSettings.closeToTray;
  readReceiptsToggle.checked = appConfig.appSettings.readReceipts;
  voiceAutoDownloadToggle.checked = appConfig.appSettings.voiceAutoDownload;
  voiceWaveformToggle.checked = appConfig.appSettings.voiceWaveform;
  const personalTrustedDomainCount = appConfig.appSettings.trustedLinkDomains.filter(
    (domain) => !DEFAULT_TRUSTED_LINK_DOMAINS.has(domain),
  ).length;
  trustedDomainsStatus.textContent = personalTrustedDomainCount
    ? `${DEFAULT_TRUSTED_LINK_DOMAINS.size} built-in · ${personalTrustedDomainCount} personal`
    : `${DEFAULT_TRUSTED_LINK_DOMAINS.size} built-in trusted domains`;
  clearTrustedDomainsButton.disabled = personalTrustedDomainCount === 0;
  trustedDefaultDomainsCount.textContent = `${DEFAULT_TRUSTED_LINK_DOMAINS.size}`;
  trustedDefaultDomainsList.replaceChildren(
    ...[...DEFAULT_TRUSTED_LINK_DOMAINS]
      .sort((first, second) => first.localeCompare(second))
      .map((domain) => {
        const domainElement = document.createElement("span");
        domainElement.textContent = domain;
        return domainElement;
      }),
  );

  notificationsToggle.checked = appConfig.notificationSettings.enabled;
  messageNotificationsToggle.checked = appConfig.notificationSettings.messages;
  callNotificationsToggle.checked = appConfig.notificationSettings.calls;
  focusedNotificationsToggle.checked =
    appConfig.notificationSettings.showWhenFocused;
  for (const toggle of [
    messageNotificationsToggle,
    callNotificationsToggle,
    focusedNotificationsToggle,
  ]) {
    toggle.disabled = !appConfig.notificationSettings.enabled;
    toggle
      .closest(".settings-check")
      ?.classList.toggle("disabled", !appConfig.notificationSettings.enabled);
  }

  soundsToggle.checked = appConfig.soundSettings.enabled;
  messageSoundToggle.checked = appConfig.soundSettings.messages;
  ringtoneSoundToggle.checked = appConfig.soundSettings.ringtone;
  callEventSoundToggle.checked = appConfig.soundSettings.callEvents;
  connectedSoundToggle.checked = appConfig.soundSettings.connected;
  for (const toggle of [
    messageSoundToggle,
    ringtoneSoundToggle,
    callEventSoundToggle,
    connectedSoundToggle,
  ]) {
    toggle.disabled = !appConfig.soundSettings.enabled;
    toggle
      .closest(".settings-check")
      ?.classList.toggle("disabled", !appConfig.soundSettings.enabled);
  }

  renderWelcomeSettings();
  syncPresenceStatusIndicator();
}

function syncPresenceStatusIndicator() {
  updateTitlebarPresenceIndicator();

  if (isNetworkOffline()) {
    setStatus("offline", "You're offline. Internet connection required.");
    return;
  }

  if (
    callState.status !== "idle" ||
    connections.size > 0 ||
    pendingConnections.size > 0
  ) {
    return;
  }

  const presenceStatus = getPresenceStatus();
  if (presenceStatus === "offline") {
    setStatus("offline", "Offline");
    return;
  }

  if (presenceStatus === "dnd") {
    setStatus("dnd", "Do Not Disturb");
    return;
  }

  setStatus("online", "Online");
}

function getPresenceStatus() {
  normalizeAppSettings();
  return appConfig.appSettings.presenceStatus;
}

function isPresenceOffline() {
  return getPresenceStatus() === "offline";
}

function isNetworkOffline() {
  return networkOffline || debugOfflineMode;
}

function updateNetworkAvailabilityUi() {
  document.body.classList.toggle("network-offline", isNetworkOffline());
  offlineBanner?.classList.toggle("hidden", !isNetworkOffline());
  offlineBanner?.setAttribute("aria-hidden", String(!isNetworkOffline()));
  remoteIdInput.disabled = isNetworkOffline();
  remoteIdInput.placeholder = isNetworkOffline()
    ? "Internet connection required"
    : "aero-...";
  updateConnectButton();
  refreshPeers();
}

function activateOfflineMode() {
  closeAllPeerConnections();
  if (peer?.open || peer?.disconnected === false) {
    intentionalPeerDisconnect = true;
    peer.disconnect();
  }
  updateNetworkAvailabilityUi();
  hideConnectRetry();
  setStatus("offline", "You're offline. Internet connection required.");
}

function enterNetworkOfflineMode() {
  if (networkOffline) {
    updateNetworkAvailabilityUi();
    setStatus("offline", "You're offline. Internet connection required.");
    return;
  }

  networkOffline = true;
  if (!debugOfflineMode) {
    activateOfflineMode();
  } else {
    updateNetworkAvailabilityUi();
  }
}

function restoreNetworkConnection({ force = false } = {}) {
  if (!networkOffline && !force) {
    return;
  }

  networkOffline = false;
  updateNetworkAvailabilityUi();
  if (debugOfflineMode) {
    setStatus("offline", "You're offline. Internet connection required.");
    return;
  }
  if (isPresenceOffline()) {
    syncPresenceStatusIndicator();
    return;
  }

  setStatus("pending", "Internet connection restored. Reconnecting...");
  if (!peer || peer.destroyed) {
    peer = createPeer();
  } else if (peer.disconnected) {
    peer.reconnect();
  } else {
    syncPresenceStatusIndicator();
  }
}

function setDebugOfflineMode(enabled) {
  const nextEnabled = Boolean(enabled);
  if (debugOfflineMode === nextEnabled) {
    return;
  }

  debugOfflineMode = nextEnabled;
  if (nextEnabled) {
    activateOfflineMode();
    return;
  }

  if (networkOffline) {
    updateNetworkAvailabilityUi();
    setStatus("offline", "You're offline. Internet connection required.");
    return;
  }

  restoreNetworkConnection({ force: true });
}

function isPresenceDnd() {
  return getPresenceStatus() === "dnd";
}

function updatePresenceMenuState() {
  const presenceStatus = getPresenceStatus();
  const entries = [
    [appMenuOnline, "online"],
    [appMenuDnd, "dnd"],
    [appMenuOffline, "offline"],
  ];

  for (const [button, value] of entries) {
    if (!button) {
      continue;
    }
    const active = presenceStatus === value;
    button.classList.toggle("active", active);
    button.setAttribute("aria-checked", active ? "true" : "false");
  }
}

function updateTitlebarPresenceIndicator() {
  const presenceStatus = isNetworkOffline() ? "offline" : getPresenceStatus();
  if (titlebarPresence) {
    titlebarPresence.className = `titlebar-presence ${presenceStatus}`;
  }
  if (titlebarSubtitle) {
    titlebarSubtitle.textContent = identity?.nickname || "Aero ID";
  }
}

function getPresenceStatusLabel(status = getPresenceStatus()) {
  if (status === "dnd") {
    return "DND";
  }

  if (status === "offline") {
    return "Offline";
  }

  return "Online";
}

function setPresenceStatus(status, { persist = false, force = false } = {}) {
  normalizeAppSettings();
  const nextStatus = ["online", "dnd", "offline"].includes(status)
    ? status
    : "online";
  if (
    appConfig.appSettings.presenceStatus === nextStatus &&
    !persist &&
    !force
  ) {
    updatePresenceMenuState();
    return;
  }

  appConfig.appSettings.presenceStatus = nextStatus;
  updatePresenceMenuState();
  updateTitlebarPresenceIndicator();
  updateConnectButton();
  if (persist) {
    saveAppSettings({ presenceStatus: nextStatus });
  } else {
    renderAppSettings();
  }

  if (nextStatus === "offline") {
    closeAllPeerConnections();
    if (peer?.open) {
      intentionalPeerDisconnect = true;
      peer.disconnect();
    } else if (peer?.disconnected) {
      intentionalPeerDisconnect = true;
    }
    setStatus("offline", "Offline");
    hideConnectRetry();
    return;
  }

  if (isNetworkOffline()) {
    setStatus("offline", "You're offline. Internet connection required.");
    return;
  }

  if (peer?.disconnected) {
    peer.reconnect();
  }

  if (callState.status === "idle") {
    setStatus(nextStatus, nextStatus === "dnd" ? "Do Not Disturb" : "Online");
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
  return saveAppConfig();
}

function closeAllPeerConnections() {
  clearOutgoingCallTimeout();
  clearAllConnectTimeouts();
  clearAllOutgoingMessageQueues();
  stopLocalRingtone();
  suppressPeerCloseMessages = true;
  try {
    for (const conn of [...connections.values()]) {
      conn.close();
    }
    for (const pending of [...pendingConnections.values()]) {
      pending.conn.close();
    }
  } finally {
    suppressPeerCloseMessages = false;
  }
}

function getSidebarWidthBounds() {
  const shellWidth = appShell?.clientWidth ?? 0;
  const maxByLayout =
    shellWidth > 0
      ? shellWidth - MIN_CHAT_WIDTH - RESIZER_WIDTH - 28
      : MAX_SIDEBAR_WIDTH;
  const lowerBound = window.innerWidth <= 700 ? 170 : MIN_SIDEBAR_WIDTH;
  return {
    min: lowerBound,
    max: Math.max(lowerBound, Math.min(MAX_SIDEBAR_WIDTH, maxByLayout)),
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
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
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
      playbackVolume: Number.isFinite(updates.playbackVolume)
        ? Math.max(0, Math.min(150, Math.round(updates.playbackVolume)))
        : 100,
      showVideoName: updates.showVideoName !== false,
      pinnedAt: new Date().toISOString(),
      avatar: normalizeAvatarConfig(updates.avatar),
      nameStyle: normalizeNameStyle(updates.nameStyle),
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

  const oldIds = getKnownPreviousIdentityIds(previousIds, identity.id).filter(
    (id) => id !== targetId,
  );
  if (oldIds.length === 0) {
    return findContact(targetId);
  }

  const existingTarget = findContact(targetId);
  const oldContacts = oldIds.map(findContact).filter(Boolean);
  if (oldContacts.length === 0) {
    return existingTarget;
  }

  const preferred =
    oldContacts.find((contact) => contact.customLabel) || oldContacts[0];
  const remoteNickname =
    sanitizeNickname(nickname) ||
    existingTarget?.remoteNickname ||
    preferred.remoteNickname;
  const updates = {
    label: preferred.customLabel
      ? preferred.label
      : remoteNickname || existingTarget?.label || preferred.label || targetId,
    remoteNickname,
    customLabel: preferred.customLabel || existingTarget?.customLabel || false,
    pinned:
      oldContacts.some((contact) => contact.pinned) ||
      existingTarget?.pinned ||
      false,
    trusted:
      oldContacts.some((contact) => contact.trusted) ||
      existingTarget?.trusted ||
      false,
    blocked:
      oldContacts.some((contact) => contact.blocked) ||
      existingTarget?.blocked ||
      false,
    playbackVolume:
      existingTarget?.playbackVolume ?? preferred.playbackVolume ?? 100,
    showVideoName:
      existingTarget?.showVideoName ?? preferred.showVideoName ?? true,
    avatar: existingTarget?.avatar || preferred.avatar,
    nameStyle: existingTarget?.nameStyle || preferred.nameStyle,
  };

  contacts = contacts.filter((contact) => !oldIds.includes(contact.id));
  const migrated = upsertContact(targetId, updates);
  refreshPeers();
  return migrated;
}

function rememberRemoteIdentity(id, nickname, avatar, nameStyle) {
  const remoteNickname = sanitizeNickname(nickname);
  if (!isValidAeroId(id) || !remoteNickname) {
    return;
  }

  const existing = findContact(id);
  upsertContact(id, {
      remoteNickname,
      label: existing?.customLabel ? existing.label : remoteNickname,
      pinned: existing?.pinned ?? true,
      avatar: normalizeAvatarConfig(avatar),
      nameStyle: normalizeNameStyle(nameStyle),
    });
}

function setContactNickname(id, nickname) {
  const cleanNickname = sanitizeNickname(nickname);
  const existing = findContact(id);
  upsertContact(id, {
    label: cleanNickname || existing?.remoteNickname || id,
    customLabel: Boolean(cleanNickname),
    pinned: true,
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
    pinned: blocked ? false : (findContact(id)?.pinned ?? true),
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

function getContactSearchQuery() {
  return normalizeAeroId(contactSearchInput?.value || "");
}

function contactMatchesSearch(peerId, connOrContact = null) {
  const query = getContactSearchQuery();
  if (!query) {
    return true;
  }

  const label = getPeerLabel(peerId, connOrContact);
  return normalizeAeroId(`${peerId} ${label}`).includes(query);
}

function appendPeerSectionLabel(text) {
  const label = document.createElement("span");
  label.className = "peer-section-label";
  label.textContent = text;
  peerList.append(label);
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
  badge.setAttribute("aria-label", title);
  badge.append(renderIcon(iconClass));
  return badge;
}

function applyNameAppearance(element, style) {
  if (!style) {
    delete element.dataset.nameFont;
    element.style.removeProperty("color");
    return;
  }
  const nameStyle = normalizeNameStyle(style);
  element.dataset.nameFont = nameStyle.font;
  if (nameStyle.color) {
    element.style.color = nameStyle.color;
  } else {
    element.style.removeProperty("color");
  }
}

function createContactIdentityLabel(labelText, style) {
  const identityLabel = document.createElement("span");
  identityLabel.className = "contact-identity";

  const label = document.createElement("span");
  label.className = "contact-label";
  label.textContent = labelText;
  if (style) {
    applyNameAppearance(label, style);
  }
  identityLabel.append(label);

  return identityLabel;
}

function updateTitlebarLogo() {
  titlebarLogo.onerror = null;
  titlebarLogo.classList.add("is-app-logo");
  titlebarLogo.src = appLogo;
  titlebarLogo.style.objectFit = "contain";
  titlebarLogo.style.borderRadius = "0";
  updateTitlebarPresenceIndicator();
}

function createAvatar(label, id, config) {
  const avatar = document.createElement("div");
  avatar.className = "contact-avatar";
  applyAvatarAppearance(avatar, id, config);
  const avatarConfig = normalizeAvatarConfig(config);
  avatar.textContent = avatarConfig.showInitial
    ? (label || id || "?").charAt(0).toUpperCase()
    : "";
  return avatar;
}

function applyAvatarAppearance(element, id, config) {
  const avatar = normalizeAvatarConfig(config);
  element.dataset.decoration = avatar.decoration;
  element.classList.toggle("avatar-without-initial", !avatar.showInitial);
  const seed = createAvatarSeed(id);
  const uniqueHue = Math.floor(seed() * 360);
  const angle = Math.floor(seed() * 360);
  const accentHue = (uniqueHue + 28 + Math.floor(seed() * 56)) % 360;
  const baseColor = avatar.template === "unique" ? `hsl(${uniqueHue} 68% 42%)` : avatar.color;
  const accentColor =
    avatar.template === "unique" ? `hsl(${accentHue} 72% 56%)` : getAccentColor(avatar.color, 34);

  if (avatar.template === "solid") {
    element.style.background = baseColor;
  } else if (avatar.template === "rings") {
    element.style.background = `radial-gradient(circle at 30% 25%, ${accentColor} 0 16%, transparent 17%), radial-gradient(circle at 70% 72%, ${accentColor} 0 23%, ${baseColor} 24% 100%)`;
  } else {
    element.style.background = `linear-gradient(${angle}deg, ${baseColor}, ${accentColor})`;
  }
}

function getAccentColor(hex, hueOffset) {
  const value = hex.slice(1);
  const red = Number.parseInt(value.slice(0, 2), 16) / 255;
  const green = Number.parseInt(value.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (delta !== 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }
  return `hsl(${(hue + hueOffset + 360) % 360} ${Math.round(saturation * 100)}% ${Math.min(72, Math.round(lightness * 100 + 16))}%)`;
}

function createAvatarSeed(value) {
  let state = 2166136261;
  for (const char of String(value || "")) {
    state ^= char.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createContactBadges({
  pinned = false,
  trusted = false,
  blocked = false,
  waiting = false,
  online = false,
}) {
  const badges = document.createElement("span");
  badges.className = "contact-badges";

  if (online) {
    badges.append(createBadge("fa-solid fa-circle", "Online", "online"));
  }
  if (waiting) {
    badges.append(
      createBadge("fa-solid fa-hourglass-half", "Waiting", "waiting"),
    );
  }
  if (trusted) {
    badges.append(
      createBadge("fa-solid fa-shield-halved", "Trusted", "trusted"),
    );
  }
  if (pinned) {
    badges.append(createBadge("fa-solid fa-star", "Favorite", "pinned"));
  }
  if (blocked) {
    badges.append(createBadge("fa-solid fa-ban", "Blocked", "blocked"));
  }

  return badges;
}

contacts = loadContacts();
setBootProgress(68, "Loading contacts");

let statusResetTimer = null;

function renderPresenceStatus() {
  const presenceStatus = isNetworkOffline() ? "offline" : getPresenceStatus();
  statusDot.className = `status-dot ${presenceStatus}`;
  statusText.textContent = getPresenceStatusLabel(presenceStatus);
  statusText.removeAttribute("title");
  titlebarStatus?.classList.toggle("hidden", presenceStatus === "online");
}

function setStatus(kind, text) {
  if (statusResetTimer) {
    clearTimeout(statusResetTimer);
    statusResetTimer = null;
  }

  if (
    text === "Online" ||
    text === "DND" ||
    text === "Do Not Disturb" ||
    text === "Offline" ||
    (kind === "offline" && isNetworkOffline())
  ) {
    renderPresenceStatus();
    return;
  }

  // Keep routine connection progress and success messages out of the compact
  // titlebar. Actionable errors remain visible briefly before presence returns.
  if (kind !== "error" && kind !== "offline") {
    return;
  }

  statusDot.className = `status-dot ${kind}`;
  statusText.textContent = text;
  statusText.title = text;
  titlebarStatus?.classList.remove("hidden");
  statusResetTimer = setTimeout(() => {
    statusResetTimer = null;
    renderPresenceStatus();
  }, 4000);
}

function isActionOnCooldown(key, cooldownMs, feedback = "") {
  const now = Date.now();
  const nextAllowedAt = actionCooldowns.get(key) || 0;
  if (now < nextAllowedAt) {
    if (feedback) {
      setStatus("pending", feedback);
    }
    return true;
  }

  actionCooldowns.set(key, now + cooldownMs);
  return false;
}

function clearConnectTimeout(peerId) {
  const timeout = connectTimeouts.get(peerId);
  if (timeout) {
    clearTimeout(timeout);
    connectTimeouts.delete(peerId);
  }
}

function clearAllConnectTimeouts() {
  for (const timeout of connectTimeouts.values()) {
    clearTimeout(timeout);
  }
  connectTimeouts.clear();
}

function hideConnectRetry() {
  lastFailedConnectId = "";
  retryConnectButton?.classList.add("hidden");
}

function showConnectRetry(peerId) {
  lastFailedConnectId = normalizeAeroId(peerId);
  if (retryConnectButton) {
    retryConnectButton.classList.toggle("hidden", !lastFailedConnectId);
  }
}

function showUnreachablePeerFeedback(peerId, { label = "", reason = "" } = {}) {
  clearConnectTimeout(peerId);
  const peerLabel =
    label ||
    getPeerLabel(
      peerId,
      pendingConnections.get(peerId)?.conn || connections.get(peerId),
    );
  const pending = pendingConnections.get(peerId);
  const established = connections.get(peerId);
  removePeer(peerId, { silent: true });
  if (pending?.conn && pending.conn !== established) {
    pending.conn.close();
  }
  established?.close();

  showConnectRetry(peerId);
  setStatus(
    "offline",
    `${peerLabel} is offline, unreachable, or not accepting connections. Use Retry to try again.`,
  );
  addSystemMessage(
    reason ||
      `${peerLabel} is offline, unreachable, or not accepting connections right now.`,
  );
  refreshPeers();
}

function isPeerUnreachableError(error) {
  const type = String(error?.type || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  return (
    type === "peer-unavailable" ||
    type === "network" ||
    type === "server-error" ||
    message.includes("could not connect to peer") ||
    message.includes("peer-unavailable") ||
    message.includes("is unavailable") ||
    message.includes("not available") ||
    message.includes("lost connection")
  );
}

function startConnectTimeout(peerId, conn) {
  clearConnectTimeout(peerId);
  connectTimeouts.set(
    peerId,
    setTimeout(() => {
      const entry = pendingConnections.get(peerId);
      if (!entry || entry.conn !== conn || entry.direction !== "outgoing") {
        return;
      }
      showUnreachablePeerFeedback(peerId, {
        label: getPeerLabel(peerId, conn),
        reason: `${getPeerLabel(peerId, conn)} did not answer in time.`,
      });
    }, CONNECT_TIMEOUT_MS),
  );
}

function getOutgoingPendingPeerId(error) {
  const outgoingPeerIds = [...pendingConnections]
    .filter(([, entry]) => entry.direction === "outgoing")
    .map(([peerId]) => peerId);
  const errorMessage = String(error?.message || "").toLowerCase();
  const matchingPeerId = outgoingPeerIds.find((peerId) =>
    errorMessage.includes(peerId.toLowerCase()),
  );

  return matchingPeerId || (outgoingPeerIds.length === 1 ? outgoingPeerIds[0] : "");
}

function clearOutgoingMessageQueue(peerId) {
  const timer = outgoingMessageTimers.get(peerId);
  if (timer) {
    clearTimeout(timer);
  }
  outgoingMessageTimers.delete(peerId);
  outgoingMessageQueues.delete(peerId);
  outgoingMessageNextSendAt.delete(peerId);
}

function clearAllOutgoingMessageQueues() {
  for (const timer of outgoingMessageTimers.values()) {
    clearTimeout(timer);
  }
  outgoingMessageTimers.clear();
  outgoingMessageQueues.clear();
  outgoingMessageNextSendAt.clear();
}

function scheduleOutgoingMessageDrain(peerId, delay = 0) {
  if (outgoingMessageTimers.has(peerId)) {
    return;
  }

  const timer = setTimeout(
    () => {
      outgoingMessageTimers.delete(peerId);
      drainOutgoingMessageQueue(peerId);
    },
    Math.max(0, delay),
  );
  outgoingMessageTimers.set(peerId, timer);
}

function drainOutgoingMessageQueue(peerId) {
  const queue = outgoingMessageQueues.get(peerId);
  if (!queue?.length) {
    clearOutgoingMessageQueue(peerId);
    return;
  }

  const conn = connections.get(peerId);
  if (!conn?.open) {
    clearOutgoingMessageQueue(peerId);
    setStatus("offline", "The active peer is not ready yet.");
    return;
  }

  if (conn.bufferSize > HIGH_BUFFER_SIZE) {
    setStatus("pending", "Waiting for the send buffer to drain...");
    scheduleOutgoingMessageDrain(peerId, 350);
    return;
  }

  const now = Date.now();
  const nextSendAt = outgoingMessageNextSendAt.get(peerId) || 0;
  if (now < nextSendAt) {
    scheduleOutgoingMessageDrain(peerId, nextSendAt - now);
    return;
  }

  const item = queue.shift();
  try {
    conn.send(item.payload);
  } catch (error) {
    clearOutgoingMessageQueue(peerId);
    setStatus("offline", `Send failed: ${error.message}`);
    return;
  }

  addChatMessage(item.message);
  outgoingMessageNextSendAt.set(peerId, Date.now() + MESSAGE_SEND_INTERVAL_MS);

  if (queue.length) {
    scheduleOutgoingMessageDrain(peerId, MESSAGE_SEND_INTERVAL_MS);
  } else {
    outgoingMessageQueues.delete(peerId);
    outgoingMessageNextSendAt.delete(peerId);
  }
}

function shouldAcceptIncomingMessage(peerId) {
  const now = Date.now();
  const current = incomingMessageWindows.get(peerId);
  if (!current || now - current.startedAt > INCOMING_MESSAGE_WINDOW_MS) {
    incomingMessageWindows.set(peerId, {
      startedAt: now,
      count: 1,
      warned: false,
    });
    return true;
  }

  current.count += 1;
  if (current.count <= MAX_INCOMING_MESSAGES_PER_WINDOW) {
    return true;
  }

  if (!current.warned) {
    current.warned = true;
    setStatus(
      "pending",
      "Too many messages from this contact. Slowing them down.",
    );
    addSystemMessage(
      `${getPeerLabel(peerId, connections.get(peerId))} is sending messages too quickly. Some messages were skipped.`,
    );
  }
  return false;
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function updateConnectButton() {
  const remoteId = normalizeAeroId(remoteIdInput.value);
  connectButton.disabled =
    !isValidAeroId(remoteId) ||
    remoteId === identity.id ||
    !peer?.open ||
    isPresenceOffline() ||
    isNetworkOffline();
  if (!remoteId || remoteId !== lastFailedConnectId) {
    hideConnectRetry();
  }
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

function syncChatActionAvailability() {
  clearChat.disabled =
    !activePeerId || (chatHistory.get(activePeerId)?.length || 0) === 0;
  chatActions.classList.toggle(
    "unavailable",
    [callChat, disconnectChat, clearChat].every((button) => button.disabled),
  );
}

function updateTypingIndicator() {
  if (!typingIndicator) {
    return;
  }

  if (
    !activePeerId ||
    (!typingStates.get(activePeerId) && !voiceRecordingStates.get(activePeerId))
  ) {
    typingIndicator.classList.add("hidden");
    typingIndicator.textContent = "";
    return;
  }

  typingIndicator.textContent = voiceRecordingStates.get(activePeerId)
    ? `${getPeerLabel(activePeerId, connections.get(activePeerId))} recording a voice message...`
    : `${getPeerLabel(activePeerId, connections.get(activePeerId))} typing...`;
  typingIndicator.classList.remove("hidden");
}

function setRemoteTyping(peerId, typing) {
  typingStates.set(peerId, Boolean(typing));
  const existing = typingTimers.get(peerId);
  if (existing) {
    clearTimeout(existing);
    typingTimers.delete(peerId);
  }

  if (typing) {
    typingTimers.set(
      peerId,
      setTimeout(() => {
        typingStates.delete(peerId);
        typingTimers.delete(peerId);
        updateTypingIndicator();
      }, TYPING_IDLE_MS + 600),
    );
  }

  updateTypingIndicator();
}

function setRemoteVoiceRecording(peerId, recording) {
  voiceRecordingStates.set(peerId, Boolean(recording));
  const existing = voiceRecordingTimers.get(peerId);
  if (existing) clearTimeout(existing);
  if (recording) {
    voiceRecordingTimers.set(
      peerId,
      setTimeout(() => {
        voiceRecordingStates.delete(peerId);
        voiceRecordingTimers.delete(peerId);
        updateTypingIndicator();
      }, 12000),
    );
  } else {
    voiceRecordingStates.delete(peerId);
    voiceRecordingTimers.delete(peerId);
  }
  updateTypingIndicator();
}

const EXTERNAL_LINK_PATTERN = /https?:\/\/[^\s<>"'`]+/gi;
const DEFAULT_TRUSTED_LINK_DOMAINS = new Set([
  "google.com", "youtube.com", "microsoft.com", "apple.com", "amazon.com", "primevideo.com",
  "wikipedia.org", "wikimedia.org", "github.com", "gitlab.com", "bitbucket.org", "stackoverflow.com", "stackexchange.com", "npmjs.com", "mozilla.org",
  "openai.com", "chatgpt.com", "discord.com", "discordapp.com", "twitch.tv", "spotify.com", "netflix.com",
  "reddit.com", "linkedin.com", "facebook.com", "instagram.com", "tiktok.com", "x.com", "twitter.com",
  "whatsapp.com", "telegram.org", "signal.org", "steampowered.com", "steamcommunity.com", "epicgames.com",
  "adobe.com", "cloudflare.com", "dropbox.com", "notion.so", "figma.com", "canva.com", "vercel.com",
  "nvidia.com", "amd.com", "intel.com", "zoom.us", "slack.com", "trello.com", "atlassian.com",
]);
let pendingExternalLinkOpen = false;

function normalizeTrustedLinkDomain(value) {
  try {
    const source = String(value || "").trim().toLowerCase();
    const url = new URL(source.includes("://") ? source : `https://${source}`);
    if (!url.hostname || url.username || url.password) return "";
    return getDomain(url.hostname, { allowPrivateDomains: true })?.toLowerCase() || "";
  } catch {
    return "";
  }
}

function isTrustedDomain(hostname, trustedDomains) {
  const normalizedHost = String(hostname || "").toLowerCase();
  return [...trustedDomains].some(
    (domain) => normalizedHost === domain || normalizedHost.endsWith(`.${domain}`),
  );
}

function trimExternalLinkMatch(value) {
  let rawUrl = String(value || "").replace(/[.,!?;:]+$/g, "");
  while (
    rawUrl.endsWith(")") &&
    (rawUrl.match(/\(/g)?.length || 0) < (rawUrl.match(/\)/g)?.length || 0)
  ) {
    rawUrl = rawUrl.slice(0, -1);
  }
  return rawUrl;
}

function getSafeExternalLink(value) {
  const rawUrl = trimExternalLinkMatch(value);
  try {
    const url = new URL(rawUrl);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return null;
    }
    return {
      url: url.toString(),
      domain: url.hostname.toLowerCase(),
      trustedDomain: normalizeTrustedLinkDomain(url.hostname),
      matchedLength: rawUrl.length,
    };
  } catch {
    return null;
  }
}

async function openExternalLinkWithConfirmation(url) {
  if (pendingExternalLinkOpen) return;
  const link = getSafeExternalLink(url);
  if (!link) return;
  const personalTrustedDomains = appConfig.appSettings?.trustedLinkDomains || [];
  if (
    isTrustedDomain(link.domain, DEFAULT_TRUSTED_LINK_DOMAINS) ||
    isTrustedDomain(link.domain, personalTrustedDomains)
  ) {
    await platformApi.openExternalLink(link.url);
    return;
  }

  pendingExternalLinkOpen = true;
  try {
    const result = await showAppDialog({
      title: "Open link?",
      message: "This link opens in your browser.",
      confirmText: "Open",
      cancelText: "Cancel",
      checkboxLabel: link.trustedDomain ? `Always trust ${link.trustedDomain}` : "",
      linkDetails: link,
    });
    const confirmation = typeof result === "boolean"
      ? { confirmed: result, checkboxChecked: false }
      : result;
    if (!confirmation.confirmed) return;
    if (confirmation.checkboxChecked && link.trustedDomain) {
      await saveAppSettings({
        trustedLinkDomains: [...personalTrustedDomains, link.trustedDomain],
      });
    }
    await platformApi.openExternalLink(link.url);
  } finally {
    pendingExternalLinkOpen = false;
  }
}

function appendMessageTextWithLinks(container, text) {
  const source = String(text || "");
  let offset = 0;
  for (const match of source.matchAll(EXTERNAL_LINK_PATTERN)) {
    const index = match.index ?? 0;
    const rawUrl = match[0];
    const link = getSafeExternalLink(rawUrl);
    if (!link) continue;
    container.append(document.createTextNode(source.slice(offset, index)));
    const anchor = document.createElement("a");
    anchor.className = "message-link";
    anchor.href = link.url;
    anchor.textContent = link.url;
    anchor.title = `Open ${link.url}`;
    anchor.rel = "noreferrer noopener";
    anchor.addEventListener("click", (event) => {
      event.preventDefault();
      void openExternalLinkWithConfirmation(link.url);
    });
    container.append(anchor);
    offset = index + link.matchedLength;
  }
  container.append(document.createTextNode(source.slice(offset)));
}

function sendVoiceRecordingState(peerId, recording) {
  return sendProtocolMessage(connections.get(peerId), "voice-recording", {
    recording: Boolean(recording),
  });
}

function sendTypingState(peerId, typing, { force = false } = {}) {
  const conn = connections.get(peerId);
  if (!conn?.open) {
    return;
  }

  const now = Date.now();
  if (
    !force &&
    typing &&
    now - (lastTypingSentAt.get(peerId) || 0) < TYPING_SEND_INTERVAL_MS
  ) {
    return;
  }

  lastTypingSentAt.set(peerId, now);
  sendProtocolMessage(conn, "typing", { typing: Boolean(typing) });
}

function scheduleLocalTypingStop(peerId) {
  const existing = localTypingTimers.get(peerId);
  if (existing) {
    clearTimeout(existing);
  }

  localTypingTimers.set(
    peerId,
    setTimeout(() => {
      localTypingTimers.delete(peerId);
      sendTypingState(peerId, false, { force: true });
    }, TYPING_IDLE_MS),
  );
}

function sendReadReceiptsForActiveChat() {
  if (
    !appConfig.appSettings?.readReceipts ||
    !activePeerId ||
    !isAppFocused()
  ) {
    return;
  }

  const conn = connections.get(activePeerId);
  if (!conn?.open) {
    return;
  }

  for (const item of ensureChatHistory(activePeerId)) {
    if (item.sender !== "them" || item.readReceiptSent || !item.id) {
      continue;
    }
    if (sendProtocolMessage(conn, "message-read", { messageId: item.id })) {
      item.readReceiptSent = true;
    }
  }
}

function createSystemMessage(text) {
  const row = document.createElement("div");
  row.className = "message-row system";
  row.textContent = text;
  return row;
}

function applyVoiceWaveform(waveform, values) {
  waveform.replaceChildren(
    ...values.map((value) => {
      const bar = document.createElement("span");
      bar.style.setProperty("--voice-level", String(value));
      return bar;
    }),
  );
}

async function analyzeVoiceWaveform(voice, waveform) {
  if (voice.waveform || !voice.blob || !window.AudioContext) return;
  try {
    voiceWaveformAudioContext ||= new AudioContext();
    const audioBuffer = await voiceWaveformAudioContext.decodeAudioData(
      await voice.blob.arrayBuffer(),
    );
    const samples = audioBuffer.getChannelData(0);
    const barCount = 24;
    const values = Array.from({ length: barCount }, (_, index) => {
      const start = Math.floor((index * samples.length) / barCount);
      const end = Math.floor(((index + 1) * samples.length) / barCount);
      const step = Math.max(1, Math.floor((end - start) / 160));
      let peak = 0;
      for (let sample = start; sample < end; sample += step) {
        peak = Math.max(peak, Math.abs(samples[sample] || 0));
      }
      return Math.max(0.12, Math.min(1, Math.sqrt(peak)));
    });
    voice.waveform = values;
    applyVoiceWaveform(waveform, values);
  } catch {
    // The verified audio remains playable even if waveform decoding is unavailable.
  }
}

function createVoiceWaveform(voice, audio) {
  const waveform = document.createElement("div");
  waveform.className = "voice-waveform";
  waveform.setAttribute("aria-hidden", "true");
  applyVoiceWaveform(waveform, voice.waveform || Array(24).fill(0.2));
  audio.addEventListener("play", () => {
    waveform.classList.add("playing");
    void analyzeVoiceWaveform(voice, waveform);
  });
  audio.addEventListener("pause", () => waveform.classList.remove("playing"));
  audio.addEventListener("ended", () => {
    waveform.classList.remove("playing");
    waveform.style.setProperty("--voice-progress", "0%");
  });
  audio.addEventListener("timeupdate", () => {
    const progress = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    waveform.style.setProperty("--voice-progress", `${progress}%`);
  });
  return waveform;
}

function createVoiceMessageBody(item) {
  const voice = item.voice;
  const body = document.createElement("div");
  body.className = "voice-message";
  const label = document.createElement("span");
  const microphone = document.createElement("i");
  microphone.className = "fa-solid fa-microphone-lines";
  microphone.setAttribute("aria-hidden", "true");
  const meta = document.createElement("small");
  meta.textContent = `${formatVoiceDuration(voice.duration)} · ${formatVoiceSize(voice.size)}`;
  label.append(microphone, "Voice message", meta);
  body.append(label);
  if (voice.downloadState === "ready" && voice.objectUrl) {
    const audio = document.createElement("audio");
    audio.className = "voice-audio";
    audio.preload = "none";
    audio.src = voice.objectUrl;
    audio.setAttribute("aria-label", "Verified voice message");
    const player = document.createElement("div");
    player.className = "voice-player";
    const playButton = document.createElement("button");
    playButton.type = "button";
    playButton.className = "voice-play-button";
    playButton.setAttribute("aria-label", "Play voice message");
    const playIcon = document.createElement("i");
    playIcon.className = "fa-solid fa-play";
    playIcon.setAttribute("aria-hidden", "true");
    playButton.append(playIcon);
    const time = document.createElement("span");
    time.className = "voice-play-time";
    const updatePlayer = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : voice.duration;
      time.textContent = `${formatVoiceDuration(audio.currentTime)} / ${formatVoiceDuration(duration)}`;
      const playing = !audio.paused && !audio.ended;
      player.classList.toggle("playing", playing);
      playIcon.className = playing ? "fa-solid fa-pause" : "fa-solid fa-play";
      playButton.setAttribute("aria-label", playing ? "Pause voice message" : "Play voice message");
    };
    playButton.addEventListener("click", () => {
      if (audio.paused || audio.ended) {
        void audio.play().catch(() => updatePlayer());
      } else {
        audio.pause();
      }
    });
    audio.addEventListener("play", updatePlayer);
    audio.addEventListener("pause", updatePlayer);
    audio.addEventListener("ended", updatePlayer);
    audio.addEventListener("timeupdate", updatePlayer);
    audio.addEventListener("loadedmetadata", updatePlayer);
    player.append(playButton);
    if (appConfig.appSettings?.voiceWaveform) {
      player.append(createVoiceWaveform(voice, audio));
    }
    player.append(time);
    updatePlayer();
    body.append(audio, player);
  } else {
    const transfer = document.createElement("div");
    transfer.className = "voice-transfer";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "voice-download-button";
    button.disabled = voice.downloadState === "requested" || voice.downloadState === "invalid";
    button.title = voice.downloadState === "invalid"
      ? "Integrity check failed"
      : voice.downloadState === "requested"
        ? "Downloading and verifying voice message"
        : "Download and verify voice message";
    button.setAttribute("aria-label", button.title);
    const icon = document.createElement("i");
    icon.className = voice.downloadState === "invalid"
      ? "fa-solid fa-triangle-exclamation"
      : voice.downloadState === "requested"
        ? "fa-solid fa-spinner fa-spin"
        : voice.downloadState === "failed"
          ? "fa-solid fa-rotate-right"
        : "fa-solid fa-download";
    icon.setAttribute("aria-hidden", "true");
    button.append(icon);
    button.addEventListener("click", () => requestVoiceMessage(item));
    const status = document.createElement("span");
    status.className = "voice-transfer-status";
    status.textContent = voice.downloadState === "invalid"
      ? "Integrity check failed"
      : voice.downloadState === "requested"
        ? "Requesting download..."
        : voice.downloadState === "failed"
          ? (voice.transferStatus || "Download interrupted - retry")
        : "Download & verify";
    const progress = document.createElement("span");
    progress.className = "voice-transfer-progress";
    transfer.append(button, status, progress);
    body.append(transfer);
  }
  return body;
}

function createChatMessage(item) {
  const {
    id,
    text,
    sender,
    peerId,
    time,
    deliveryStatus = sender === "me" ? "sent" : "",
  } = item;
  const row = document.createElement("div");
  row.className = `message-row ${sender === "me" ? "mine" : "theirs"}`;
  row.dataset.messageId = id;

  const bubble = document.createElement("article");
  bubble.className = "bubble";

  const footer = document.createElement("span");
  footer.className = "bubble-footer";
  const timestamp = document.createElement("time");
  timestamp.textContent = time ?? formatTime();
  footer.append(timestamp);
  if (sender === "me" && areReadReceiptsVisibleForPeer(peerId)) {
    const state = document.createElement("span");
    state.className = `message-state ${deliveryStatus}`;
    state.title = formatDeliveryStatus(deliveryStatus);
    state.setAttribute("aria-label", formatDeliveryStatus(deliveryStatus));
    state.append(...createDeliveryStatusIcons(deliveryStatus));
    footer.append(state);
  }

  const body = item.voice ? createVoiceMessageBody(item) : document.createElement("p");
  if (!item.voice) appendMessageTextWithLinks(body, text);

  bubble.append(body, footer);
  row.append(bubble);

  bubble.addEventListener("contextmenu", (event) => {
    openMessageMenu(event, item);
  });

  return row;
}

function formatDeliveryStatus(status) {
  if (!appConfig.appSettings?.readReceipts) {
    return "Message status disabled";
  }
  if (status === "read") {
    return "Read";
  }
  if (status === "delivered") {
    return "Delivered";
  }
  return "Sent";
}

function createDeliveryStatusIcons(status) {
  const visibleStatus = status === "read" ? "read" : status;
  const indicator = document.createElement("span");
  indicator.className = `message-state-dot ${visibleStatus === "read" ? "read" : "sent"}`;
  indicator.setAttribute("aria-hidden", "true");
  return [indicator];
}

function refreshMessageDeliveryState(peerId, messageId) {
  if (activePeerId !== peerId) {
    return;
  }

  const item = ensureChatHistory(peerId).find(
    (message) => message.id === messageId,
  );
  const row = item
    ? messages.querySelector(`[data-message-id="${messageId}"]`)
    : null;
  const state = row?.querySelector(".message-state");
  if (!item || !row) {
    return;
  }
  if (!areReadReceiptsVisibleForPeer(peerId)) {
    state?.remove();
    return;
  }
  const footer = row.querySelector(".bubble-footer");
  if (!state && footer) {
    const nextState = document.createElement("span");
    nextState.className = `message-state ${item.deliveryStatus || "sent"}`;
    nextState.title = formatDeliveryStatus(item.deliveryStatus || "sent");
    nextState.setAttribute(
      "aria-label",
      formatDeliveryStatus(item.deliveryStatus || "sent"),
    );
    nextState.append(
      ...createDeliveryStatusIcons(item.deliveryStatus || "sent"),
    );
    footer.append(nextState);
    return;
  }
  if (!state) {
    return;
  }

  state.className = `message-state ${item.deliveryStatus || "sent"}`;
  state.title = formatDeliveryStatus(item.deliveryStatus || "sent");
  state.setAttribute(
    "aria-label",
    formatDeliveryStatus(item.deliveryStatus || "sent"),
  );
  state.replaceChildren(
    ...createDeliveryStatusIcons(item.deliveryStatus || "sent"),
  );
}

function setMessageDeliveryState(peerId, messageId, status) {
  const item = ensureChatHistory(peerId).find(
    (message) => message.id === messageId && message.sender === "me",
  );
  if (!item) {
    return;
  }

  const order = { sent: 0, delivered: 1, read: 2 };
  const current = order[item.deliveryStatus || "sent"] ?? 0;
  const next = order[status] ?? 0;
  if (next < current) {
    return;
  }

  item.deliveryStatus = status;
  refreshMessageDeliveryState(peerId, messageId);
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
  syncChatActionAvailability();
  updateTypingIndicator();
  refreshCallStage();
  sendReadReceiptsForActiveChat();
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
    if (value.startsWith('"') && value.endsWith('"')) {
      value = JSON.parse(value);
    }
    manifest[key] = value;
  }
  return manifest;
}

function compareVersions(left, right) {
  const leftParts = String(left)
    .split(".")
    .map((part) => Number(part) || 0);
  const rightParts = String(right)
    .split(".")
    .map((part) => Number(part) || 0);

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
  ignoredUpdateVersion = "";
  startupUpdateModal.dataset.required = "false";
  updateModal.dataset.required = "false";
  headerUpdateButton.classList.add("hidden");
  updateCard.classList.add("hidden");
  titlebarLogo.classList.remove("update-available");
  titlebarLogo.removeAttribute("title");
  appMenuUpdate.classList.remove("hidden");
  appMenuUpdate.disabled = false;
  setTitlebarActionLabel(
    appMenuUpdate,
    platformApi.isWindowsStore ? "Open Microsoft Store updates" : "Check for updates",
  );
  appMenuUpdate.querySelector("i").className = "fa-solid fa-rotate-right";
  appMenuUpdateIgnore.classList.add("hidden");
}

function syncAvailableUpdateUi() {
  if (updateMenuResetTimer) {
    clearTimeout(updateMenuResetTimer);
    updateMenuResetTimer = null;
  }

  if (!availableUpdate) {
    clearUpdateAvailableUi();
    return;
  }

  const isMandatory = Boolean(availableUpdate.mandatory);
  const isIgnored = !isMandatory && ignoredUpdateVersion === availableUpdate.version;
  updateTitle.textContent = isMandatory ? "Update required" : "Update available";
  updateText.textContent = isMandatory
    ? `Version ${availableUpdate.minimumVersion} or later is required to continue.`
    : `Version ${availableUpdate.version} is ready. You are using ${currentVersion}.`;
  updateButton.textContent = platformApi.supportsNativeUpdateInstall
    ? "Install update"
    : platform === "linux"
      ? "Show command"
      : "Open release";
  updateIgnoreButton.textContent = isIgnored ? "Ignored" : "Ignore";
  updateIgnoreButton.disabled = isIgnored;
  updateIgnoreButton.classList.toggle("hidden", isMandatory);
  headerUpdateButton.classList.add("hidden");
  titlebarLogo.classList.add("update-available");
    if ((isMandatory || !isIgnored) && startupUpdateModalShownForVersion !== availableUpdate.version) {
      startupUpdateModalShownForVersion = availableUpdate.version;
      startupUpdateModal.dataset.required = String(isMandatory);
      startupUpdateTitle.textContent = isMandatory ? "Update required" : "Update available";
      startupUpdateText.textContent = isMandatory
        ? `Version ${availableUpdate.minimumVersion} or later is required to continue.`
        : `Version ${availableUpdate.version} is ready. You are using ${currentVersion}.`;
      startupUpdateButton.textContent = platformApi.supportsNativeUpdateInstall
        ? "Install update"
        : platform === "linux"
          ? "Show command"
          : "Open release";
      startupUpdateModal.classList.remove("hidden");
    }
  startupUpdateClose.classList.toggle("hidden", isMandatory);
  startupUpdateIgnoreButton.classList.toggle("hidden", isMandatory);
  titlebarLogo.title = isIgnored
    ? `Update ${availableUpdate.version} available`
    : `Update ${availableUpdate.version} available`;
  appMenuUpdate.classList.remove("hidden");
  appMenuUpdate.disabled = false;
  appMenuUpdate.querySelector("i").className =
    platformApi.supportsNativeUpdateInstall
      ? "fa-solid fa-download"
      : platform === "linux"
        ? "fa-solid fa-terminal"
        : "fa-solid fa-arrow-up-right-from-square";
  appMenuUpdateIgnore.classList.toggle("hidden", isMandatory);
  setTitlebarActionLabel(
    appMenuUpdate,
    platformApi.supportsNativeUpdateInstall
      ? `Install ${availableUpdate.version}`
      : `Update ${availableUpdate.version}`,
  );
  appMenuUpdateIgnore.querySelector("span").textContent = isIgnored
    ? `Ignored ${availableUpdate.version}`
    : `Ignore update hint`;
}

function setUpdateMenuStatus(text, { reset = true } = {}) {
  if (updateMenuResetTimer) {
    clearTimeout(updateMenuResetTimer);
    updateMenuResetTimer = null;
  }

  appMenuUpdate.classList.remove("hidden");
  setTitlebarActionLabel(appMenuUpdate, text);
  appMenuUpdate.querySelector("i").className = "fa-solid fa-rotate-right";

  if (reset) {
    updateMenuResetTimer = setTimeout(() => {
      updateMenuResetTimer = null;
      syncAvailableUpdateUi();
    }, 1800);
  }
}

function ignoreAvailableUpdateHint() {
  if (!availableUpdate || availableUpdate.mandatory) {
    return;
  }

  ignoredUpdateVersion = availableUpdate.version;
  syncAvailableUpdateUi();
}

async function checkForUpdates({ manual = false } = {}) {
  if (platformApi.isWindowsStore) {
    if (manual) {
      const result = await platformApi.openMicrosoftStoreUpdates();
      if (result?.ok) {
        setUpdateMenuStatus("Microsoft Store opened");
        setStatus("online", "Updates are managed by the Microsoft Store.");
      } else {
        setUpdateMenuStatus("Microsoft Store unavailable");
      }
    }
    return;
  }

  if (isNetworkOffline()) {
    if (manual) {
      setStatus("offline", "You're offline. Internet connection required.");
    }
    return;
  }

  if (updateCheckInFlight) {
    if (manual) {
      setUpdateMenuStatus("Checking...", { reset: false });
    }
    return;
  }

  updateCheckInFlight = true;
  if (manual) {
    setUpdateMenuStatus("Checking...", { reset: false });
    setStatus("pending", "Checking for updates...");
  }

  try {
    let manifestText = "";
    const manifestResult =
      await platformApi.fetchUpdateManifest(latestManifestUrl);
    if (typeof manifestResult === "string") {
      manifestText = manifestResult;
    } else if (manifestResult?.ok && typeof manifestResult.text === "string") {
      manifestText = manifestResult.text;
    } else {
      throw new Error(
        manifestResult?.error || "Update manifest request failed.",
      );
    }

    const manifest = parseManifest(manifestText);
    const latestVersion = manifest.version;
    const effectiveCurrentVersion = debugSimulateUpdate ? "0.0.0" : currentVersion;
    const minimumVersion = /^\d+\.\d+\.\d+$/.test(manifest.minimumVersion || "")
      ? manifest.minimumVersion
      : "";
    const mandatory =
      Boolean(minimumVersion) &&
      compareVersions(effectiveCurrentVersion, minimumVersion) < 0;
    if (
      !latestVersion ||
      (!mandatory && compareVersions(latestVersion, effectiveCurrentVersion) <= 0)
    ) {
      clearUpdateAvailableUi();
      if (manual) {
        setUpdateMenuStatus("No update found");
        setStatus("online", "You are up to date.");
      }
      return;
    }

    const windowsUrl =
      manifest.windowsUrl || manifest.windows_url || manifest.url || "";
    const windowsSha256 =
      manifest.windowsSha256 ||
      manifest.windows_sha256 ||
      manifest.sha256 ||
      "";
    const windowsSha512 =
      manifest.windowsSha512 ||
      manifest.windows_sha512 ||
      manifest.sha512 ||
      "";
    const onlineInstallerUrl =
      manifest.onlineInstallerUrl || manifest.online_installer_url || "";
    const onlineInstallerSha256 =
      manifest.onlineInstallerSha256 ||
      manifest.online_installer_sha256 ||
      "";
    const onlineInstallerSha512 =
      manifest.onlineInstallerSha512 ||
      manifest.online_installer_sha512 ||
      "";
    if (platform === "win32" && !windowsUrl) {
      clearUpdateAvailableUi();
      if (manual) {
        setUpdateMenuStatus("No installer found");
        setStatus("offline", "Update manifest has no Windows installer.");
      }
      return;
    }
    if (
      platform === "win32" &&
      (!windowsSha256 ||
        !windowsSha512 ||
        !onlineInstallerUrl ||
        !onlineInstallerSha256 ||
        !onlineInstallerSha512)
    ) {
      clearUpdateAvailableUi();
      if (manual) {
        setUpdateMenuStatus("Invalid update");
        setStatus("offline", "Update manifest is missing checksums.");
      }
      return;
    }
    const macosUrl = manifest.macosUniversalDmgUrl || "";
    if (platform === "darwin" && !macosUrl) {
      clearUpdateAvailableUi();
      if (manual) {
        setUpdateMenuStatus("No macOS build found");
        setStatus("offline", "Update manifest has no macOS installer.");
      }
      return;
    }

    availableUpdate = {
      version: latestVersion,
      minimumVersion,
      mandatory,
      windowsUrl,
      windowsSha256,
      windowsSha512,
      onlineInstallerUrl,
      onlineInstallerSha256,
      onlineInstallerSha512,
      linuxUrl: manifest.linuxUrl || manifest.linuxX64AppImageUrl || "",
      linuxSha256:
        manifest.linuxSha256 || manifest.linuxX64AppImageSha256 || "",
      macosUrl,
    };

    syncAvailableUpdateUi();
    if (manual) {
      setStatus("online", `Update ${availableUpdate.version} available.`);
    }
  } catch (error) {
    // Keep an existing update hint visible when a periodic check fails.
    if (manual) {
      setUpdateMenuStatus("Check failed");
      setStatus(
        "offline",
        `Update check failed${error?.message ? `: ${error.message}` : "."}`,
      );
    }
  } finally {
    updateCheckInFlight = false;
  }
}

function addSystemMessage(text) {
  appendMessageRow(createSystemMessage(text));
}

function addChatMessage({ id, text, sender, peerId, time, voice }) {
  const item = {
    id: id ?? createMessageId(),
    text,
    sender,
    peerId,
    time: time ?? formatTime(),
    voice,
  };

  if (sender !== "me") {
    platformApi.vibrate("light");
  }

  const history = ensureChatHistory(peerId);
  history.push(item);
  const trimmed = history.length > MAX_CHAT_HISTORY_ITEMS;
  if (trimmed) {
    history.splice(0, history.length - MAX_CHAT_HISTORY_ITEMS);
  }

  if (activePeerId === peerId) {
    if (trimmed) {
      renderChatHistory();
      return;
    }
    appendMessageRow(createChatMessage(item));
    return;
  }

  if (sender !== "me") {
    unreadCounts.set(peerId, (unreadCounts.get(peerId) || 0) + 1);
    refreshPeers();
  }
}

function showAppNotification(details) {
  normalizeAppSettings();
  if (!appConfig.notificationSettings.enabled) {
    return false;
  }

  if (notificationState.systemDnd && !isAppFocused()) {
    return false;
  }

  if (!appConfig.notificationSettings.showWhenFocused && isAppFocused()) {
    return false;
  }

  const promise = platformApi
    .showNotification({
      ...details,
      theme: appConfig.appSettings.theme,
      showWhenFocused: appConfig.notificationSettings.showWhenFocused,
    })
    .catch(() => {});
    
  if (!details.silent) {
    playSound(messageAudio, "messages");
  }

  return promise;
}

function isSoundEnabled(key) {
  normalizeAppSettings();
  return Boolean(
    appConfig.soundSettings.enabled && appConfig.soundSettings[key],
  );
}

async function shouldPlaySound(key) {
  if (!isSoundEnabled(key)) {
    return false;
  }

  if (isAppFocused()) {
    return true;
  }

  try {
    const state = await platformApi.getNotificationState();
    if (state && typeof state === "object") {
      notificationState = {
        appFocused: Boolean(state.appFocused),
        systemDnd: Boolean(state.systemDnd),
      };
    }
  } catch {
    // Native notification state is optional outside Electron.
  }

  return !notificationState.systemDnd;
}

function playSound(audio, key) {
  shouldPlaySound(key).then((canPlay) => {
    if (!canPlay) {
      return;
    }

    audio.currentTime = 0;
    audio.play().catch(() => {});
  });
}

function isAppFocused() {
  return document.visibilityState === "visible" && document.hasFocus();
}

function refreshNotificationState() {
  notificationState.appFocused = isAppFocused();
  platformApi
    .getNotificationState()
    .then((state) => {
      if (!state || typeof state !== "object") {
        return;
      }
      notificationState = {
        appFocused: Boolean(state.appFocused),
        systemDnd: Boolean(state.systemDnd),
      };
    })
    .catch(() => {
      notificationState.appFocused = isAppFocused();
    });
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

  platformApi.closeNotification(id).catch(() => {});
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
  if (isPresenceDnd()) {
    return;
  }

  playSound(connectedAudio, "connected");
}

function notifyIncomingMessage(peerId, text) {
  normalizeAppSettings();
  refreshNotificationState();
  if (isPresenceDnd() || isPresenceOffline()) {
    return;
  }

  if (!appConfig.notificationSettings.messages) {
    playMessageFallbackSound();
    return;
  }

  const conn = connections.get(peerId);
  const identityId = getPeerIdentityId(peerId, conn);

  const shown = showAppNotification({
    kind: "message",
    peerId,
    avatar: getPeerAvatar(peerId, identityId),
    title: getPeerLabel(peerId, conn),
    body: text,
    silent: !isSoundEnabled("messages"),
  });
  if (!shown) {
    playMessageFallbackSound();
  }
}

function notifyIncomingCall(peerId, callId) {
  normalizeAppSettings();
  refreshNotificationState();
  if (isPresenceDnd() || isPresenceOffline()) {
    return;
  }

  playLocalRingtone();

  if (document.hasFocus()) {
    return;
  }

  if (!appConfig.notificationSettings.calls) {
    return;
  }

  const conn = connections.get(peerId);
  const identityId = getPeerIdentityId(peerId, conn);

  showAppNotification({
    id: getCallNotificationId(callId),
    kind: "call",
    peerId,
    avatar: getPeerAvatar(peerId, identityId),
    callId,
    title: "Incoming voice call",
    body: `${getPeerLabel(peerId, conn)} is calling`,
    silent: true,
  });
}

function sendChatText(peerId, rawText) {
  const text = String(rawText || "").trim();
  if (!text) {
    return false;
  }

  if (isNetworkOffline()) {
    setStatus("offline", "You're offline. Internet connection required.");
    return false;
  }

  if (isPresenceOffline()) {
    setStatus("offline", "Offline");
    return false;
  }

  const conn = connections.get(peerId);
  if (!conn?.open) {
    setStatus("offline", "The active peer is not ready yet.");
    return false;
  }

  const queue = outgoingMessageQueues.get(peerId) || [];
  if (queue.length >= MAX_QUEUED_OUTGOING_MESSAGES) {
    setStatus("pending", "Slow down a bit. Message queue is full.");
    return false;
  }

  const messageId = createMessageId();
  const payload = {
    type: "chat-message",
    id: messageId,
    protocol: PROTOCOL_VERSION,
    text: text.slice(0, MAX_MESSAGE_LENGTH),
    time: formatTime(),
  };

  queue.push({
    payload,
    message: {
      id: messageId,
      text: payload.text,
      sender: "me",
      peerId,
      time: payload.time,
      deliveryStatus: "sent",
    },
  });
  outgoingMessageQueues.set(peerId, queue);
  scheduleOutgoingMessageDrain(peerId);

  if (queue.length > 4) {
    setStatus("pending", `Sending ${queue.length} queued messages...`);
  }
  return true;
}

function createVoiceMessageId() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return `voice-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function formatVoiceDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function formatVoiceSize(bytes) {
  return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
}

function getVoiceMessageMimeType() {
  if (!window.MediaRecorder || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder.isTypeSupported !== "function") {
    return "";
  }
  return [...VOICE_MESSAGE_MIME_TYPES].find((type) =>
    MediaRecorder.isTypeSupported(type),
  ) || "";
}

function syncComposerAction() {
  const recording = voiceRecorder?.state === "recording";
  const hasText = messageInput.value.trim().length > 0;
  const canSend = Boolean(activePeerId && connections.get(activePeerId)?.open && hasText && !recording);
  sendButton.disabled = !canSend;
  sendButton.classList.toggle("hidden", !hasText || recording);
  voiceRecordButton.classList.toggle("hidden", hasText && !recording);
  emojiPickerButton.disabled = messageInput.disabled || recording;
  if (recording || messageInput.disabled) {
    void setEmojiPickerOpen(false);
    closeEmojiShortcodeSuggestions();
  }
}

let emojiPicker = null;
let emojiPickerLoading = null;
let emojiPickerClickModifiers = [];
let countryFlagEmojiSupportPromise = null;

function enableCountryFlagEmojiSupport() {
  if (countryFlagEmojiSupportPromise) return countryFlagEmojiSupportPromise;
  countryFlagEmojiSupportPromise = import("country-flag-emoji-polyfill")
    .then(({ polyfillCountryFlagEmojis }) =>
      polyfillCountryFlagEmojis("Twemoji Country Flags", countryFlagEmojiFontUrl),
    )
    .catch((error) => {
      console.warn("[Aero] Country flag emoji fallback could not load.", error);
      return false;
    });
  return countryFlagEmojiSupportPromise;
}

void enableCountryFlagEmojiSupport();

async function ensureEmojiPicker() {
  if (emojiPicker) return emojiPicker;
  if (emojiPickerLoading) return emojiPickerLoading;

  emojiPickerLoading = (async () => {
    const [pickerModule, translationModule] = await Promise.all([
      import("emoji-picker-element/picker"),
      import("emoji-picker-element/i18n/de"),
    ]);
    const picker = new pickerModule.default({
      dataSource: emojiDataUrl,
      locale: "de",
      i18n: translationModule.default,
    });
    picker.addEventListener("click", (event) => {
      const emojiTarget = event.composedPath().find(
        (node) => node instanceof Element && node.classList.contains("emoji"),
      );
      if (emojiTarget) emojiPickerClickModifiers.push({ keepOpen: event.shiftKey });
    }, true);
    picker.addEventListener("emoji-click-sync", (event) => {
      const { keepOpen = false } = emojiPickerClickModifiers.shift() || {};
      Promise.resolve(event.detail).then((detail) => {
        const emoji = detail?.unicode;
        if (!emoji || messageInput.disabled) return;
        const start = messageInput.selectionStart ?? messageInput.value.length;
        const end = messageInput.selectionEnd ?? start;
        messageInput.setRangeText(emoji, start, end, "end");
        messageInput.dispatchEvent(new Event("input", { bubbles: true }));
        if (!keepOpen) {
          messageInput.focus();
          void setEmojiPickerOpen(false);
        }
      });
    });
    emojiPicker = picker;
    emojiPickerPopover.replaceChildren(picker);
    return picker;
  })();

  try {
    return await emojiPickerLoading;
  } finally {
    emojiPickerLoading = null;
  }
}

async function setEmojiPickerOpen(open) {
  const shouldOpen = Boolean(open && !messageInput.disabled && !emojiPickerButton.disabled);
  if (!shouldOpen) {
    emojiPickerPopover.classList.add("hidden");
    emojiPickerButton.setAttribute("aria-expanded", "false");
    return;
  }

  closeEmojiShortcodeSuggestions();
  emojiPickerPopover.classList.toggle("hidden", !shouldOpen);
  emojiPickerButton.setAttribute("aria-expanded", "true");
  if (emojiPicker) return;

  emojiPickerPopover.replaceChildren(Object.assign(document.createElement("div"), {
    className: "emoji-picker-loading",
    textContent: "Loading emoji…",
  }));
  emojiPickerButton.setAttribute("aria-busy", "true");
  try {
    await ensureEmojiPicker();
  } catch (error) {
    console.warn("[Aero] Emoji picker could not load.", error);
    emojiPickerPopover.classList.add("hidden");
    emojiPickerButton.setAttribute("aria-expanded", "false");
    showToast("Emoji picker could not load. Please try again.", "error");
  } finally {
    emojiPickerButton.removeAttribute("aria-busy");
  }
}

let emojiShortcodeIndex = null;
let emojiShortcodeIndexLoading = null;
let emojiShortcodeSuggestions = [];
let emojiShortcodeSelection = 0;
let emojiShortcodeSearchVersion = 0;

function getEmojiShortcodeTrigger() {
  const cursor = messageInput.selectionStart ?? messageInput.value.length;
  const prefix = messageInput.value.slice(0, cursor);
  const match = prefix.match(/(?:^|[\s([{:]):([a-z0-9_+-]{1,48})$/i);
  if (!match) return null;
  return {
    query: match[1].toLowerCase(),
    start: cursor - match[1].length - 1,
    end: cursor,
  };
}

function closeEmojiShortcodeSuggestions() {
  emojiShortcodeSearchVersion += 1;
  emojiShortcodeSuggestions = [];
  emojiShortcodeSelection = 0;
  emojiShortcodePopover.classList.add("hidden");
  emojiShortcodePopover.replaceChildren();
  messageInput.setAttribute("aria-expanded", "false");
  messageInput.removeAttribute("aria-activedescendant");
}

async function loadEmojiShortcodeIndex() {
  if (emojiShortcodeIndex) return emojiShortcodeIndex;
  if (emojiShortcodeIndexLoading) return emojiShortcodeIndexLoading;
  emojiShortcodeIndexLoading = fetch(emojiShortcodeDataUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`Emoji data request failed (${response.status})`);
      return response.json();
    })
    .then((emojiData) => emojiData.flatMap((emoji) =>
      (emoji.shortcodes || []).map((shortcode) => ({
        emoji: emoji.emoji,
        shortcode: String(shortcode).toLowerCase(),
      })),
    ));
  try {
    emojiShortcodeIndex = await emojiShortcodeIndexLoading;
    return emojiShortcodeIndex;
  } finally {
    emojiShortcodeIndexLoading = null;
  }
}

function renderEmojiShortcodeSuggestions(suggestions) {
  emojiShortcodeSuggestions = suggestions;
  emojiShortcodeSelection = Math.min(emojiShortcodeSelection, Math.max(0, suggestions.length - 1));
  emojiShortcodePopover.replaceChildren(...suggestions.map((suggestion, index) => {
    const option = document.createElement("button");
    option.id = `emoji-shortcode-option-${index}`;
    option.type = "button";
    option.className = "emoji-shortcode-option";
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", String(index === emojiShortcodeSelection));
    option.append(
      Object.assign(document.createElement("span"), { className: "emoji-shortcode-symbol", textContent: suggestion.emoji }),
      Object.assign(document.createElement("span"), { className: "emoji-shortcode-name", textContent: `:${suggestion.shortcode}:` }),
    );
    option.addEventListener("click", () => insertEmojiShortcodeSuggestion(suggestion));
    return option;
  }));
  emojiShortcodePopover.classList.remove("hidden");
  messageInput.setAttribute("aria-expanded", "true");
  messageInput.setAttribute("aria-activedescendant", `emoji-shortcode-option-${emojiShortcodeSelection}`);
}

function insertEmojiShortcodeSuggestion(suggestion) {
  const trigger = getEmojiShortcodeTrigger();
  if (!trigger) return;
  messageInput.setRangeText(suggestion.emoji, trigger.start, trigger.end, "end");
  messageInput.dispatchEvent(new Event("input", { bubbles: true }));
  closeEmojiShortcodeSuggestions();
  messageInput.focus();
}

async function refreshEmojiShortcodeSuggestions() {
  const trigger = getEmojiShortcodeTrigger();
  if (!trigger || messageInput.disabled) {
    closeEmojiShortcodeSuggestions();
    return;
  }

  const searchVersion = ++emojiShortcodeSearchVersion;
  emojiShortcodePopover.replaceChildren(Object.assign(document.createElement("div"), {
    className: "emoji-shortcode-loading",
    textContent: "Searching emoji…",
  }));
  emojiShortcodePopover.classList.remove("hidden");
  messageInput.setAttribute("aria-expanded", "true");
  try {
    const index = await loadEmojiShortcodeIndex();
    if (searchVersion !== emojiShortcodeSearchVersion) return;
    const currentTrigger = getEmojiShortcodeTrigger();
    if (!currentTrigger || currentTrigger.query !== trigger.query) return closeEmojiShortcodeSuggestions();
    const suggestions = index
      .map((item) => ({
        ...item,
        score: item.shortcode === trigger.query ? 0 : item.shortcode.startsWith(trigger.query) ? 1 : 2,
      }))
      .filter((item) => item.score < 2 || item.shortcode.includes(trigger.query))
      .sort((first, second) => first.score - second.score || first.shortcode.localeCompare(second.shortcode))
      .slice(0, 6);
    if (!suggestions.length) return closeEmojiShortcodeSuggestions();
    emojiShortcodeSelection = 0;
    renderEmojiShortcodeSuggestions(suggestions);
  } catch (error) {
    console.warn("[Aero] Emoji shortcode data could not load.", error);
    closeEmojiShortcodeSuggestions();
  }
}

function updateVoiceRecordUi() {
  const recording = voiceRecorder?.state === "recording";
  voiceRecordButton.classList.toggle("recording", recording);
  voiceRecordButton.disabled = !recording && (!activePeerId || !connections.get(activePeerId)?.open || !getVoiceMessageMimeType());
  voiceRecordButton.title = recording ? "Stop and send voice message" : "Record voice message";
  voiceRecordButton.setAttribute("aria-label", voiceRecordButton.title);
  voiceRecordButton.querySelector("i").className = recording
    ? "fa-solid fa-stop"
    : "fa-solid fa-microphone";
  voiceRecordStatus.classList.toggle("hidden", !recording);
  if (!recording) voiceRecordStatus.textContent = "";
  syncComposerAction();
}

async function sha256Hex(blob) {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function hasExpectedVoiceSignature(blob, mimeType) {
  const header = new Uint8Array(await blob.slice(0, 8192).arrayBuffer());
  const headerText = new TextDecoder().decode(header);
  if (mimeType.startsWith("audio/webm")) {
    return header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3 && headerText.includes("A_OPUS");
  }
  return headerText.startsWith("OggS") && headerText.includes("OpusHead");
}

function findVoiceMessage(peerId, voiceId) {
  return ensureChatHistory(peerId).find(
    (item) => item.voice?.id === voiceId,
  );
}

function normalizeVoiceOffer(voice) {
  if (!voice || typeof voice !== "object") return null;
  const id = String(voice.id || "");
  const mimeType = String(voice.mimeType || "").toLowerCase();
  const size = Number(voice.size);
  const duration = Number(voice.duration);
  const sha256 = String(voice.sha256 || "").toLowerCase();
  if (
    !/^voice-[a-f0-9]{24}$/.test(id) ||
    !VOICE_MESSAGE_MIME_TYPES.has(mimeType) ||
    !Number.isInteger(size) || size < 1 || size > VOICE_MESSAGE_MAX_BYTES ||
    !Number.isFinite(duration) || duration < 0 || duration > VOICE_MESSAGE_MAX_DURATION_SECONDS ||
    !/^[a-f0-9]{64}$/.test(sha256)
  ) {
    return null;
  }
  return { id, mimeType, size, duration, sha256 };
}

async function sendRecordedVoiceMessage(blob, duration, peerId) {
  if (!peerId || !connections.get(peerId)?.open) {
    throw new Error("Contact is no longer connected.");
  }
  if (!VOICE_MESSAGE_MIME_TYPES.has(blob.type.toLowerCase())) {
    throw new Error("Unsupported voice format.");
  }
  if (!blob.size || blob.size > VOICE_MESSAGE_MAX_BYTES) {
    throw new Error("Voice message is too large.");
  }
  const voice = {
    id: createVoiceMessageId(),
    mimeType: blob.type.toLowerCase(),
    size: blob.size,
    duration: Math.min(VOICE_MESSAGE_MAX_DURATION_SECONDS, Math.max(0, duration)),
    sha256: await sha256Hex(blob),
  };
  const messageId = createMessageId();
  const conn = connections.get(peerId);
  if (!sendProtocolMessage(conn, "voice-offer", { id: messageId, voice })) {
    throw new Error("Could not offer voice message.");
  }
  while (pendingVoiceUploads.size >= MAX_PENDING_VOICE_UPLOADS) {
    pendingVoiceUploads.delete(pendingVoiceUploads.keys().next().value);
  }
  pendingVoiceUploads.set(voice.id, { blob, peerId, voice, expiresAt: Date.now() + VOICE_MESSAGE_EXPIRY_MS });
  setTimeout(() => pendingVoiceUploads.delete(voice.id), VOICE_MESSAGE_EXPIRY_MS);
  writeDevLog(`Voice message offered (${Math.round(blob.size / 1024)} KB).`);
  addChatMessage({
    id: messageId,
    text: "",
    sender: "me",
    peerId,
    time: formatTime(),
    deliveryStatus: "sent",
    voice: { ...voice, downloadState: "ready", objectUrl: URL.createObjectURL(blob), blob },
  });
}

async function startVoiceRecording() {
  if (voiceRecorder?.state === "recording") {
    voiceRecorder.stop();
    return;
  }
  const mimeType = getVoiceMessageMimeType();
  if (!mimeType || !activePeerId || !connections.get(activePeerId)?.open) {
    setStatus("pending", "Voice messages are unavailable for this connection.");
    return;
  }
  try {
    voiceRecordingStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    const chunks = [];
    voiceRecorder = new MediaRecorder(voiceRecordingStream, {
      mimeType,
      audioBitsPerSecond: VOICE_MESSAGE_BITRATE,
    });
    voiceRecordingPeerId = activePeerId;
    sendTypingState(voiceRecordingPeerId, false, { force: true });
    sendVoiceRecordingState(voiceRecordingPeerId, true);
    clearInterval(voiceRecordingPresenceTimer);
    voiceRecordingPresenceTimer = setInterval(
      () => sendVoiceRecordingState(voiceRecordingPeerId, true),
      5000,
    );
    voiceRecordingStartedAt = Date.now();
    voiceRecorder.ondataavailable = ({ data }) => {
      if (data.size) chunks.push(data);
      if (voiceRecorder?.state === "recording" && chunks.reduce((total, chunk) => total + chunk.size, 0) > VOICE_MESSAGE_MAX_BYTES) {
        voiceRecorder?.stop();
      }
    };
    voiceRecorder.onstop = async () => {
      const duration = (Date.now() - voiceRecordingStartedAt) / 1000;
      clearInterval(voiceRecordingTimer);
      voiceRecordingTimer = null;
      clearInterval(voiceRecordingPresenceTimer);
      voiceRecordingPresenceTimer = null;
      voiceRecordingStream?.getTracks().forEach((track) => track.stop());
      voiceRecordingStream = null;
      voiceRecorder = null;
      const peerId = voiceRecordingPeerId;
      voiceRecordingPeerId = null;
      if (peerId) sendVoiceRecordingState(peerId, false);
      updateVoiceRecordUi();
      const blob = new Blob(chunks, { type: mimeType });
      if (duration < 0.3 || !blob.size) return;
      try {
        await sendRecordedVoiceMessage(blob, duration, peerId);
      } catch (error) {
        setStatus("pending", `Voice message not sent: ${error.message}`);
      }
    };
    voiceRecorder.start(1000);
    voiceRecordingTimer = setInterval(() => {
      const seconds = (Date.now() - voiceRecordingStartedAt) / 1000;
      voiceRecordStatus.textContent = `${formatVoiceDuration(seconds)} / ${formatVoiceDuration(VOICE_MESSAGE_MAX_DURATION_SECONDS)}`;
      if (seconds >= VOICE_MESSAGE_MAX_DURATION_SECONDS) voiceRecorder?.stop();
    }, 250);
    updateVoiceRecordUi();
  } catch (error) {
    clearInterval(voiceRecordingPresenceTimer);
    voiceRecordingPresenceTimer = null;
    if (voiceRecordingPeerId) sendVoiceRecordingState(voiceRecordingPeerId, false);
    voiceRecordingPeerId = null;
    voiceRecordingStream?.getTracks().forEach((track) => track.stop());
    voiceRecordingStream = null;
    setStatus("pending", `Microphone unavailable: ${error.message || error}`);
    updateVoiceRecordUi();
  }
}

function getBinaryChunk(value) {
  if (value instanceof ArrayBuffer) return value;
  if (ArrayBuffer.isView(value)) {
    return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
  }
  return null;
}

async function sendVoiceTransfer(conn, upload) {
  if (!sendProtocolMessage(conn, "voice-transfer-start", { voice: upload.voice })) {
    throw new Error("Could not start transfer.");
  }
  for (let offset = 0, index = 0; offset < upload.blob.size; offset += VOICE_MESSAGE_CHUNK_BYTES, index += 1) {
    if (!conn.open) throw new Error("Transfer interrupted.");
    if (conn.bufferSize > 2 * 1024 * 1024) {
      await new Promise((resolve) => setTimeout(resolve, 30));
      offset -= VOICE_MESSAGE_CHUNK_BYTES;
      index -= 1;
      continue;
    }
    const bytes = await upload.blob.slice(offset, offset + VOICE_MESSAGE_CHUNK_BYTES).arrayBuffer();
    if (!sendProtocolMessage(conn, "voice-transfer-chunk", { voiceId: upload.voice.id, index, bytes })) {
      throw new Error("Transfer interrupted.");
    }
  }
  sendProtocolMessage(conn, "voice-transfer-complete", { voiceId: upload.voice.id });
}

function requestVoiceMessage(item) {
  if (!item?.voice) return;
  const voice = item.voice;
  if (!voice || item.sender === "me" || voice.downloadState === "ready") return;
  const conn = connections.get(item.peerId);
  if (!conn?.open) {
    setStatus("pending", "Reconnect to download this voice message.");
    return;
  }
  delete voice.transferStatus;
  voice.downloadState = "requested";
  writeDevLog("Voice message download requested.");
  renderChatHistory();
  if (!sendProtocolMessage(conn, "voice-request", { voiceId: voice.id })) {
    voice.downloadState = "offered";
    renderChatHistory();
  }
}

function failVoiceDownload(peerId, voiceId, message = "Download interrupted - retry") {
  incomingVoiceTransfers.delete(`${peerId}:${voiceId}`);
  const item = findVoiceMessage(peerId, voiceId);
  if (!item?.voice || item.voice.downloadState !== "requested") return;
  item.voice.downloadState = "failed";
  item.voice.transferStatus = message;
  writeDevLog(`Voice message download failed: ${message}`);
  if (activePeerId === peerId) renderChatHistory();
}

function updateVoiceDownloadStatus(peerId, voiceId, text, progress = 0) {
  if (activePeerId !== peerId) return;
  const item = findVoiceMessage(peerId, voiceId);
  const row = item
    ? Array.from(messages.querySelectorAll(".message-row")).find(
      (candidate) => candidate.dataset.messageId === item.id,
    )
    : null;
  row?.querySelector(".voice-transfer-status")?.replaceChildren(text);
  row?.querySelector(".voice-transfer-progress")?.style.setProperty(
    "--voice-transfer-progress",
    `${Math.max(0, Math.min(100, progress))}%`,
  );
}

function handleVoiceOffer(peerId, conn, data) {
  const voice = normalizeVoiceOffer(data.voice);
  if (!voice || !shouldAcceptIncomingMessage(peerId) || findVoiceMessage(peerId, voice.id)) return;
  const messageId = typeof data.id === "string" ? data.id.slice(0, 128) : createMessageId();
  addChatMessage({ id: messageId, text: "", sender: "them", peerId, time: typeof data.time === "string" ? data.time : formatTime(), voice: { ...voice, downloadState: "offered" } });
  if (appConfig.appSettings?.readReceipts) sendProtocolMessage(conn, "message-delivered", { messageId });
  notifyIncomingMessage(peerId, "Voice message - click to download and verify");
  if (appConfig.appSettings?.voiceAutoDownload) {
    requestVoiceMessage(findVoiceMessage(peerId, voice.id));
  }
}

function handleVoiceRequest(peerId, conn, data) {
  const voiceId = String(data.voiceId || "");
  const upload = pendingVoiceUploads.get(voiceId);
  if (!upload || upload.peerId !== peerId || upload.expiresAt < Date.now()) {
    sendProtocolMessage(conn, "voice-transfer-failed", { voiceId });
    return;
  }
  sendVoiceTransfer(conn, upload).catch(() => {
    sendProtocolMessage(conn, "voice-transfer-failed", { voiceId: upload.voice.id });
  });
}

function handleVoiceTransferStart(peerId, conn, data) {
  const voice = normalizeVoiceOffer(data.voice);
  const item = voice && findVoiceMessage(peerId, voice.id);
  if (!voice || !item || item.voice.downloadState !== "requested" || item.voice.sha256 !== voice.sha256 || incomingVoiceTransfers.size >= MAX_ACTIVE_VOICE_TRANSFERS) {
    sendProtocolMessage(conn, "voice-transfer-failed", { voiceId: String(data.voice?.id || "") });
    return;
  }
  incomingVoiceTransfers.set(`${peerId}:${voice.id}`, { voice, chunks: [], receivedSize: 0, nextIndex: 0 });
  writeDevLog(`Voice message transfer started (${Math.round(voice.size / 1024)} KB).`);
  updateVoiceDownloadStatus(peerId, voice.id, "Downloading...", 0);
  setTimeout(() => {
    const key = `${peerId}:${voice.id}`;
    if (incomingVoiceTransfers.has(key)) failVoiceDownload(peerId, voice.id, "Download timed out - retry");
  }, VOICE_MESSAGE_EXPIRY_MS);
}

function handleVoiceTransferChunk(peerId, data) {
  const key = `${peerId}:${String(data.voiceId || "")}`;
  const transfer = incomingVoiceTransfers.get(key);
  const bytes = getBinaryChunk(data.bytes);
  if (!transfer || !bytes || !Number.isInteger(data.index) || data.index !== transfer.nextIndex || !bytes.byteLength || bytes.byteLength > VOICE_MESSAGE_CHUNK_BYTES || transfer.receivedSize + bytes.byteLength > transfer.voice.size) {
    if (transfer) failVoiceDownload(peerId, transfer.voice.id, "Invalid transfer data - retry");
    return;
  }
  transfer.chunks.push(bytes);
  transfer.receivedSize += bytes.byteLength;
  transfer.nextIndex += 1;
  updateVoiceDownloadStatus(
    peerId,
    transfer.voice.id,
    `Downloading ${Math.round((transfer.receivedSize / transfer.voice.size) * 100)}%`,
    (transfer.receivedSize / transfer.voice.size) * 100,
  );
}

async function handleVoiceTransferComplete(peerId, data) {
  const voiceId = String(data.voiceId || "");
  const key = `${peerId}:${voiceId}`;
  const transfer = incomingVoiceTransfers.get(key);
  incomingVoiceTransfers.delete(key);
  const item = transfer && findVoiceMessage(peerId, voiceId);
  if (!transfer || !item) return;
  if (transfer.receivedSize !== transfer.voice.size) {
    failVoiceDownload(peerId, voiceId, "Incomplete download - retry");
    return;
  }
  const blob = new Blob(transfer.chunks, { type: transfer.voice.mimeType });
  updateVoiceDownloadStatus(peerId, voiceId, "Verifying integrity...", 100);
  try {
    if ((await sha256Hex(blob)) !== transfer.voice.sha256) throw new Error("SHA-256 mismatch");
    if (!(await hasExpectedVoiceSignature(blob, transfer.voice.mimeType))) throw new Error("Invalid audio format");
    item.voice.blob = blob;
    item.voice.objectUrl = URL.createObjectURL(blob);
    item.voice.downloadState = "ready";
    writeDevLog("Voice message downloaded and verified.");
  } catch {
    item.voice.downloadState = "invalid";
    writeDevLog("Voice message verification failed.");
  }
  if (activePeerId === peerId) renderChatHistory();
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

function getLocalParticipantLabel() {
  return sanitizeNickname(identity.nickname) || "You";
}

function getStagePeerId() {
  return activePeerId || callState.peerId || null;
}

function getRemoteParticipantLabel(peerId = getStagePeerId()) {
  if (!peerId) {
    return "Contact";
  }

  return getPeerLabel(peerId, connections.get(peerId)) || "Contact";
}

function formatMicrophoneError(error) {
  if (error?.name === "NotAllowedError") {
    return "Mic blocked";
  }
  if (
    error?.name === "NotFoundError" ||
    error?.name === "DevicesNotFoundError"
  ) {
    return "No microphone";
  }
  return "Mic unavailable";
}

function getCallVideoQualityProfile(profile = callState.videoQualityProfile) {
  if (profile === "low") {
    return {
      name: "low",
      maxBitrate: 170000,
      maxFramerate: 10,
      scaleResolutionDownBy: 3,
      degradationPreference: "maintain-framerate",
    };
  }

  if (profile === "high") {
    return {
      name: "high",
      maxBitrate: 450000,
      maxFramerate: 18,
      scaleResolutionDownBy: 1.35,
      degradationPreference: "balanced",
    };
  }

  return {
    name: "medium",
    maxBitrate: 280000,
    maxFramerate: 14,
    scaleResolutionDownBy: 2,
    degradationPreference: "maintain-framerate",
  };
}

function normalizeScreenQuality(value) {
  return Object.hasOwn(SCREEN_STREAM_PROFILES, value) ? value : "720p";
}

function normalizeScreenFps(value) {
  const fps = Number(value);
  return SCREEN_STREAM_FPS_OPTIONS.includes(fps) ? fps : 30;
}

function getScreenStreamBaseBitrate(
  quality = screenShareState.quality,
  fps = screenShareState.fps,
) {
  const normalizedQuality = normalizeScreenQuality(quality);
  const normalizedFps = normalizeScreenFps(fps);
  const profile = SCREEN_STREAM_PROFILES[normalizedQuality];
  const fpsFactor =
    normalizedFps === 60 ? 1.42 : normalizedFps === 15 ? 0.72 : 1;
  return Math.round(profile.bitrate * fpsFactor);
}

function getScreenStreamConstraints(
  sourceId,
  {
    quality = screenShareState.quality,
    fps = screenShareState.fps,
    audio = false,
  } = {},
) {
  const profile = SCREEN_STREAM_PROFILES[normalizeScreenQuality(quality)];
  const normalizedFps = normalizeScreenFps(fps);
  const mandatory = {
    chromeMediaSource: "desktop",
    chromeMediaSourceId: sourceId,
    minFrameRate: Math.min(15, normalizedFps),
    maxFrameRate: normalizedFps,
  };

  if (profile.height > 0) {
    const width = Math.round((profile.height * 16) / 9);
    mandatory.minWidth = Math.min(width, 1280);
    mandatory.minHeight = Math.min(profile.height, 720);
    mandatory.maxWidth = width;
    mandatory.maxHeight = profile.height;
  }

  return {
    audio: audio
      ? {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: sourceId,
          },
        }
      : false,
    video: { mandatory },
  };
}

function formatScreenCaptureError(error) {
  if (error?.name === "NotAllowedError") {
    return "Screen capture blocked.";
  }
  if (
    error?.name === "NotFoundError" ||
    error?.name === "OverconstrainedError"
  ) {
    return "Screen source unavailable.";
  }
  return "Could not start screen stream.";
}

function prepareLiveVideoElement(video, { smoothPlayback = false } = {}) {
  if (!video) {
    return;
  }

  video.autoplay = true;
  video.playsInline = true;
  video.preload = "auto";
  video.disablePictureInPicture = true;
  video.controls = false;
  video.playbackRate = 1;
  video.dataset.smoothPlayback = smoothPlayback ? "true" : "false";
}

function setVideoElementStream(video, stream, options = {}) {
  if (!video) {
    return;
  }

  if (video.srcObject !== stream) {
    video.pause();
    video.srcObject = stream || null;
  }

  if (stream) {
    prepareLiveVideoElement(video, options);
    video.play().catch(() => {});
  } else {
    video.pause();
    video.removeAttribute("src");
    video.load();
  }
}

function drawCallPlaceholderFrame(canvas, context) {
  const width = canvas.width;
  const height = canvas.height;
  const localLabel = getLocalParticipantLabel();
  const accentText =
    String(localLabel || "A")
      .trim()
      .slice(0, 1)
      .toUpperCase() || "A";
  const darkMode = document.body?.dataset?.theme === "dark";
  const background = darkMode ? "#111b24" : "#eef4f7";
  const plateBackground = darkMode ? "#182733" : "#ffffff";
  const plateBorder = darkMode ? "#334858" : "#cfdee6";
  const textColor = darkMode ? "#edf4f7" : "#122b3a";

  context.clearRect(0, 0, width, height);
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.fillStyle = plateBorder;
  context.beginPath();
  context.roundRect(
    width * 0.23,
    height * 0.2,
    width * 0.54,
    height * 0.54,
    width * 0.12,
  );
  context.fill();

  context.fillStyle = plateBackground;
  context.beginPath();
  context.roundRect(
    width * 0.245,
    height * 0.225,
    width * 0.49,
    height * 0.49,
    width * 0.105,
  );
  context.fill();

  context.fillStyle = textColor;
  context.font = `800 ${Math.round(width * 0.18)}px "Segoe UI", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(accentText, width * 0.49, height * 0.47);
}

function createPlaceholderVideoTrack() {
  const canvas = document.createElement("canvas");
  canvas.width = CALL_CAMERA_WIDTH;
  canvas.height = CALL_CAMERA_HEIGHT;
  const context = canvas.getContext("2d");

  if (!context || typeof canvas.captureStream !== "function") {
    return null;
  }

  drawCallPlaceholderFrame(canvas, context);
  const stream = canvas.captureStream(CALL_PLACEHOLDER_VIDEO_FPS);
  const track = stream.getVideoTracks()[0] || null;
  if (!track) {
    return null;
  }

  const interval = window.setInterval(
    () => {
      drawCallPlaceholderFrame(canvas, context);
    },
    Math.round(1000 / CALL_PLACEHOLDER_VIDEO_FPS),
  );

  track._cleanupPlaceholder = () => {
    window.clearInterval(interval);
    stream.getTracks().forEach((item) => item.stop());
  };

  track.addEventListener(
    "ended",
    () => {
      window.clearInterval(interval);
    },
    { once: true },
  );

  return track;
}

function stopMediaTrack(track) {
  if (!track) {
    return;
  }

  if (typeof track._cleanupPlaceholder === "function") {
    const cleanup = track._cleanupPlaceholder;
    track._cleanupPlaceholder = null;
    cleanup();
    return;
  }

  track.stop();
}

function stopLocalCameraCapture() {
  callState.localCameraStream?.getTracks().forEach((track) => track.stop());
  callState.localCameraStream = null;
}

function updateParticipantCard(
  card,
  video,
  shouldShowVideo,
  speaking,
  hasError = false,
) {
  card?.classList.toggle("camera-on", shouldShowVideo);
  card?.classList.toggle("speaking", Boolean(speaking));
  card?.classList.toggle("error", Boolean(hasError));
  video?.classList.toggle("hidden", !shouldShowVideo);
}

function hasStreamForTarget(target) {
  return target === "local"
    ? Boolean(screenShareState.localStream)
    : Boolean(
        screenShareState.remoteStream &&
        screenShareState.viewerWatching &&
        !screenShareState.hiddenByViewer,
      );
}

function setStreamFullscreenTarget(target = "") {
  const nextTarget = hasStreamForTarget(target) ? target : "";
  streamFullscreenTarget = nextTarget;
  callStage?.classList.toggle("stream-fullscreen", Boolean(nextTarget));
  callStage?.classList.toggle("fullscreen-local", nextTarget === "local");
  callStage?.classList.toggle("fullscreen-remote", nextTarget === "remote");
  appShell?.classList.toggle("stream-fullscreen-active", Boolean(nextTarget));
  refreshCallStage();
}

function toggleStreamFullscreen(target) {
  setStreamFullscreenTarget(streamFullscreenTarget === target ? "" : target);
}

function updateStreamFullscreenControl(button, target) {
  if (!button) {
    return;
  }

  const active = streamFullscreenTarget === target;
  button.classList.toggle("hidden", !hasStreamForTarget(target));
  button.classList.toggle("active", active);
  const icon = button.querySelector("i");
  if (icon) {
    icon.className = active ? "fa-solid fa-compress" : "fa-solid fa-expand";
  }
  button.title = active ? "Shrink stream" : "Expand stream";
  button.setAttribute("aria-label", button.title);
}

function createParticipantBadge(iconClass, title, state = "") {
  const badge = document.createElement("span");
  badge.className = `participant-badge ${state}`.trim();
  badge.title = title;
  badge.setAttribute("aria-label", title);
  const icon = document.createElement("i");
  icon.className = iconClass;
  icon.setAttribute("aria-hidden", "true");
  badge.append(icon);
  return badge;
}

function renderParticipantBadges(
  container,
  { muted = false, deafened = false, streamHidden = false } = {},
) {
  if (!container) {
    return;
  }

  container.replaceChildren();
  if (streamHidden) {
    container.append(
      createParticipantBadge("fa-solid fa-display", "Stream hidden", "stream"),
    );
  }
  if (muted) {
    container.append(
      createParticipantBadge("fa-solid fa-microphone-slash", "Muted", "muted"),
    );
  }
  if (deafened) {
    container.append(
      createParticipantBadge("fa-solid fa-headphones", "Deafened", "deafened"),
    );
  }
}

function refreshCallStage() {
  const stagePeerId = getStagePeerId();
  const inCall = callState.status !== "idle" && Boolean(callState.peerId);
  if (!stagePeerId || !inCall) {
    callStage?.classList.add("hidden");
    callStage?.classList.remove(
      "stream-fullscreen",
      "fullscreen-local",
      "fullscreen-remote",
    );
    appShell?.classList.remove("stream-fullscreen-active");
    streamFullscreenTarget = "";
    setVideoElementStream(localVideo, null);
    setVideoElementStream(remoteVideo, null);
    setVideoElementStream(localPipVideo, null);
    setVideoElementStream(remotePipVideo, null);
    localParticipantCard?.classList.remove("streaming");
    remoteParticipantCard?.classList.remove("streaming");
    updateStreamFullscreenControl(localStreamFullscreen, "local");
    updateStreamFullscreenControl(remoteStreamFullscreen, "remote");
    return;
  }

  const inCallWithStagePeer = callState.peerId === stagePeerId;
  const localLabel = getLocalParticipantLabel();
  const remoteLabel = getRemoteParticipantLabel(stagePeerId);
  const localScreenActive = Boolean(screenShareState.localStream);
  const remoteStreamAvailable = Boolean(screenShareState.remoteStream);
  const remoteScreenHidden =
    remoteStreamAvailable &&
    (!screenShareState.viewerWatching || screenShareState.hiddenByViewer);
  const remoteScreenActive = remoteStreamAvailable && !remoteScreenHidden;
  const localDisplayStream = localScreenActive
    ? screenShareState.localStream
    : callState.localCameraStream;
  const remoteDisplayStream = remoteScreenActive
    ? screenShareState.remoteStream
    : callState.remoteStream;
  const localPipStream =
    localScreenActive && callState.localCameraEnabled
      ? callState.localCameraStream
      : null;
  const remotePipStream =
    remoteScreenActive && callState.remoteCameraEnabled
      ? callState.remoteStream
      : null;
  const showLocalVideo =
    inCallWithStagePeer &&
    Boolean(localDisplayStream) &&
    (localScreenActive || callState.localCameraEnabled);
  const showRemoteVideo =
    inCallWithStagePeer &&
    Boolean(remoteDisplayStream) &&
    (remoteScreenActive || callState.remoteCameraEnabled);
  const showLocalPip = inCallWithStagePeer && Boolean(localPipStream);
  const showRemotePip = inCallWithStagePeer && Boolean(remotePipStream);
  const showLocalName =
    !showLocalVideo ||
    isOwnVideoNameVisible() ||
    Boolean(callState.localErrorMessage);
  const showRemoteName =
    !showRemoteVideo || isPeerVideoNameVisible(stagePeerId);

  if (!hasStreamForTarget(streamFullscreenTarget)) {
    streamFullscreenTarget = "";
    callStage?.classList.remove(
      "stream-fullscreen",
      "fullscreen-local",
      "fullscreen-remote",
    );
    appShell?.classList.remove("stream-fullscreen-active");
  }

  callStage?.classList.remove("hidden");
  if (localParticipantName) {
    localParticipantName.textContent = localLabel;
    applyNameAppearance(localParticipantName, identity.nameStyle);
  }
  if (remoteParticipantName) {
    remoteParticipantName.textContent = remoteLabel;
    applyNameAppearance(
      remoteParticipantName,
      getPeerNameStyle(stagePeerId, getPeerIdentityId(stagePeerId)),
    );
  }
  if (localParticipantStatus) {
    localParticipantStatus.textContent = inCallWithStagePeer
      ? localScreenActive
        ? "Streaming"
        : callState.localErrorMessage || ""
      : "";
  }
  if (remoteParticipantStatus) {
    remoteParticipantStatus.textContent = remoteScreenActive
      ? "Streaming"
      : remoteScreenHidden
        ? "Stream hidden"
        : "";
  }
  localParticipantCard?.classList.toggle("hide-name", !showLocalName);
  remoteParticipantCard?.classList.toggle("hide-name", !showRemoteName);
  localParticipantCard?.classList.toggle("streaming", localScreenActive);
  remoteParticipantCard?.classList.toggle("streaming", remoteScreenActive);
  localParticipantCard?.classList.toggle("has-pip", showLocalPip);
  remoteParticipantCard?.classList.toggle("has-pip", showRemotePip);
  callStage?.classList.toggle(
    "stream-fullscreen",
    Boolean(streamFullscreenTarget),
  );
  callStage?.classList.toggle(
    "fullscreen-local",
    streamFullscreenTarget === "local",
  );
  callStage?.classList.toggle(
    "fullscreen-remote",
    streamFullscreenTarget === "remote",
  );
  appShell?.classList.toggle(
    "stream-fullscreen-active",
    Boolean(streamFullscreenTarget),
  );

  setVideoElementStream(
    localVideo,
    showLocalVideo ? localDisplayStream : null,
    { smoothPlayback: localScreenActive },
  );
  setVideoElementStream(
    remoteVideo,
    showRemoteVideo ? remoteDisplayStream : null,
    { smoothPlayback: remoteScreenActive },
  );
  setVideoElementStream(localPipVideo, showLocalPip ? localPipStream : null);
  setVideoElementStream(remotePipVideo, showRemotePip ? remotePipStream : null);
  localPipVideo?.classList.toggle("hidden", !showLocalPip);
  remotePipVideo?.classList.toggle("hidden", !showRemotePip);
  updateStreamFullscreenControl(localStreamFullscreen, "local");
  updateStreamFullscreenControl(remoteStreamFullscreen, "remote");
  renderParticipantBadges(localParticipantBadges, {
    muted: callState.muted,
    deafened: callState.deafened,
  });
  renderParticipantBadges(remoteParticipantBadges, {
    muted: remoteCallStatus.muted,
    deafened: remoteCallStatus.deafened,
    streamHidden: remoteScreenHidden,
  });
  updateParticipantCard(
    localParticipantCard,
    localVideo,
    showLocalVideo,
    localVoiceGateIsOpen && !callState.muted,
    Boolean(callState.localErrorMessage),
  );
  updateParticipantCard(
    remoteParticipantCard,
    remoteVideo,
    showRemoteVideo,
    remoteVoiceIsActive && !remoteCallStatus.muted,
  );
  refreshAutoFitText();
}

function stopLocalCallStream() {
  stopLocalCameraCapture();
  callState.localStream?._rawVoiceStream
    ?.getTracks()
    .forEach((track) => track.stop());
  callState.localStream?.getTracks().forEach((track) => stopMediaTrack(track));
  callState.localStream = null;
}

function clearRemoteAudio() {
  remoteAudio.pause();
  remoteAudio.srcObject = null;
  remoteAudio.load();
}

function stopRemoteVoiceMeterLoop() {
  if (remoteVoiceMeterFrame) {
    cancelAnimationFrame(remoteVoiceMeterFrame);
    remoteVoiceMeterFrame = 0;
  }
}

function resetRemoteVoiceProcessingState() {
  stopRemoteVoiceMeterLoop();
  remoteVoiceAnalyserNode = null;
  remoteVoiceMeterBuffer = null;
  remoteVoiceNoiseFloor = 0.008;
  remoteVoiceIsActive = false;
  remoteVoiceAudioContext?.close().catch(() => {});
  remoteVoiceAudioContext = null;
}

function updateRemoteVoiceMeter() {
  if (!remoteVoiceAnalyserNode) {
    return;
  }

  if (
    !remoteVoiceMeterBuffer ||
    remoteVoiceMeterBuffer.length !== remoteVoiceAnalyserNode.fftSize
  ) {
    remoteVoiceMeterBuffer = new Float32Array(remoteVoiceAnalyserNode.fftSize);
  }

  remoteVoiceAnalyserNode.getFloatTimeDomainData(remoteVoiceMeterBuffer);
  let sumSquares = 0;
  for (const sample of remoteVoiceMeterBuffer) {
    sumSquares += sample * sample;
  }

  const rms = Math.sqrt(sumSquares / remoteVoiceMeterBuffer.length);
  if (rms < remoteVoiceNoiseFloor * 1.3) {
    remoteVoiceNoiseFloor = remoteVoiceNoiseFloor * 0.95 + rms * 0.05;
  } else {
    remoteVoiceNoiseFloor = remoteVoiceNoiseFloor * 0.997 + rms * 0.003;
  }
  remoteVoiceNoiseFloor = Math.max(
    0.0012,
    Math.min(0.03, remoteVoiceNoiseFloor),
  );

  const threshold = Math.max(0.009, remoteVoiceNoiseFloor * 1.9 + 0.003);
  const nextActive =
    rms >= threshold && !remoteAudio.muted && !remoteCallStatus.muted;
  if (nextActive !== remoteVoiceIsActive) {
    remoteVoiceIsActive = nextActive;
    refreshCallStage();
  }

  remoteVoiceMeterFrame = requestAnimationFrame(updateRemoteVoiceMeter);
}

async function startRemoteVoiceMeter(stream) {
  resetRemoteVoiceProcessingState();
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (
    typeof AudioContextClass !== "function" ||
    !stream?.getAudioTracks?.().length
  ) {
    return;
  }

  try {
    remoteVoiceAudioContext = new AudioContextClass();
    await remoteVoiceAudioContext.resume().catch(() => {});
    const source = remoteVoiceAudioContext.createMediaStreamSource(stream);
    const analyser = remoteVoiceAudioContext.createAnalyser();
    analyser.fftSize = VOICE_METER_FFT;
    source.connect(analyser);
    remoteVoiceAnalyserNode = analyser;
    remoteVoiceMeterBuffer = new Float32Array(analyser.fftSize);
    remoteVoiceMeterFrame = requestAnimationFrame(updateRemoteVoiceMeter);
  } catch {
    resetRemoteVoiceProcessingState();
  }
}

function isCallBusy() {
  return callState.status !== "idle";
}

function formatCallHealthLabel(quality = "unknown", latencyMs = null) {
  const label =
    quality === "good"
      ? "Good"
      : quality === "unstable"
        ? "Unstable"
        : quality === "bad"
          ? "Bad"
          : "Checking";
  return latencyMs == null ? label : `${label} · ${latencyMs} ms`;
}

function setCallHealthUi({
  quality = "unknown",
  latencyMs = null,
  visible = callState.status === "active",
} = {}) {
  if (!callHealth) {
    return;
  }

  callHealth.classList.toggle("hidden", !visible);
  callHealth.classList.remove("good", "unstable", "bad", "unknown");
  callHealth.classList.add(quality);
  const label = `Call health: ${formatCallHealthLabel(quality, latencyMs)}`;
  callHealth.title = label;
  callHealth.setAttribute("aria-label", label);
}

function refreshCallUi() {
  const activeConn = activePeerId ? connections.get(activePeerId) : null;
  const canStartCall = Boolean(
    activeConn?.open && !isCallBusy() && !isNetworkOffline(),
  );
  callChat.disabled = !canStartCall;

  callAccept.classList.add("hidden");
  callDecline.classList.add("hidden");
  callMute.classList.add("hidden");
  callDeafen.classList.add("hidden");
  callCamera.classList.add("hidden");
  callStream.classList.add("hidden");
  callHangup.classList.add("hidden");
  callMute.classList.toggle("active", callState.muted);
  callDeafen.classList.toggle("active", callState.deafened);
  callMute.classList.toggle("enabled", !callState.muted);
  callMute.classList.toggle("disabled", callState.muted);
  callDeafen.classList.toggle("enabled", !callState.deafened);
  callDeafen.classList.toggle("disabled", callState.deafened);
  callCamera.classList.toggle("active", callState.localCameraEnabled);
  callStream.classList.toggle("active", Boolean(screenShareState.localStream));
  callCamera.classList.toggle("camera", true);
  callMute.querySelector("span").textContent = callState.muted
    ? "Unmute"
    : "Mute";
  callDeafen.querySelector("span").textContent = callState.deafened
    ? "Undeafen"
    : "Deafen";
  callCamera.querySelector("span").textContent = callState.localCameraEnabled
    ? "Hide Cam"
    : "Show Cam";
  callStream.querySelector("span").textContent = screenShareState.localStream
    ? "Stop Stream"
    : "Stream";
  callMute.title = callState.muted ? "Unmute microphone" : "Mute microphone";
  callDeafen.title = callState.deafened ? "Undeafen" : "Deafen";
  callCamera.title = callState.localCameraEnabled
    ? "Hide camera"
    : "Show camera";
  callStream.title = screenShareState.localStream
    ? "Stop screen stream"
    : "Share screen";
  callMute.setAttribute("aria-label", callMute.title);
  callDeafen.setAttribute("aria-label", callDeafen.title);
  callCamera.setAttribute("aria-label", callCamera.title);
  callStream.setAttribute("aria-label", callStream.title);
  setCallHealthUi({ visible: false });

  incomingCallScreen?.classList.toggle("hidden", callState.status !== "incoming");
  if (callState.status === "incoming" && incomingCallName) {
    incomingCallName.textContent = getActiveCallLabel() || "Peer";
    applyNameAppearance(
      incomingCallName,
      getPeerNameStyle(callState.peerId, getPeerIdentityId(callState.peerId)),
    );
  }

  if (callState.status === "idle") {
    callBanner.classList.add("hidden");
    callPeerName.textContent = "";
    refreshCallStage();
    return;
  }

  callBanner.classList.remove("hidden");
  const label = getActiveCallLabel() || "Peer";
  callPeerName.textContent = callState.status === "active" ? "" : label;
  applyNameAppearance(
    callPeerName,
    getPeerNameStyle(callState.peerId, getPeerIdentityId(callState.peerId)),
  );

  if (callState.status === "incoming") {
    callText.textContent = "Incoming";
    callAccept.classList.remove("hidden");
    callDecline.classList.remove("hidden");
    refreshCallStage();
    return;
  }

  if (callState.status === "outgoing") {
    callText.textContent = "Calling";
    callHangup.classList.remove("hidden");
    refreshCallStage();
    return;
  }

  if (callState.status === "connecting") {
    callText.textContent = "Connecting";
    callMute.classList.remove("hidden");
    callDeafen.classList.remove("hidden");
    callCamera.classList.remove("hidden");
    callStream.classList.remove("hidden");
    callHangup.classList.remove("hidden");
    refreshCallStage();
    return;
  }

  callText.textContent = "Voice";
  callMute.classList.remove("hidden");
  callDeafen.classList.remove("hidden");
  callCamera.classList.remove("hidden");
  callStream.classList.remove("hidden");
  callHangup.classList.remove("hidden");
  setCallHealthUi({
    quality: callState.healthLastStats?.quality || "unknown",
    latencyMs: callState.healthLastStats?.latencyMs ?? null,
    visible: true,
  });
  refreshCallStage();
}

function setCallState(status, updates = {}) {
  Object.assign(callState, updates, { status });
  applyLocalMuteState();
  remoteAudio.muted = callState.deafened;
  refreshCallUi();
}

function clearOutgoingCallTimeout() {
  if (outgoingCallTimeout) {
    clearTimeout(outgoingCallTimeout);
    outgoingCallTimeout = null;
  }
}

function scheduleOutgoingCallTimeout() {
  clearOutgoingCallTimeout();
  outgoingCallTimeout = setTimeout(() => {
    outgoingCallTimeout = null;
    if (callState.status === "outgoing") {
      const peerId = callState.peerId;
      const conn = peerId ? connections.get(peerId) : null;
      const label = getPeerLabel(peerId, conn);
      addSystemMessage(`No answer from ${label}. Call ended.`);
      endVoiceCall({ notifyPeer: true, message: "Call timed out." });
    }
  }, OUTGOING_CALL_TIMEOUT_MS);
}

function isCurrentCallSession(peerId, callId, allowedStatuses = null) {
  return Boolean(
    callState.peerId === peerId &&
      callState.callId === callId &&
      (!allowedStatuses || allowedStatuses.includes(callState.status)),
  );
}

function stopCallStreamCandidate(stream) {
  stream?._rawVoiceStream?.getTracks().forEach((track) => track.stop());
  stream?.getTracks().forEach((track) => stopMediaTrack(track));
}

function resetCallState() {
  voiceCaptureGeneration += 1;
  clearOutgoingCallTimeout();
  stopCallHealthMonitor();
  closeStreamSetup();
  stopLocalScreenShare({ notifyPeer: false });
  stopRemoteScreenShare();
  const mediaConn = callState.mediaConn;
  const incomingMediaConn = callState.incomingMediaConn;
  const localStream = callState.localStream;
  const localCameraStream = callState.localCameraStream;
  const remoteStream = callState.remoteStream;
  const videoQualityMonitor = callState.videoQualityMonitor;

  Object.assign(callState, {
    peerId: null,
    callId: "",
    status: "idle",
    mediaConn: null,
    incomingMediaConn: null,
    localStream: null,
    localCameraStream: null,
    localCameraEnabled: false,
    remoteStream: null,
    remoteCameraEnabled: false,
    videoQualityProfile: "medium",
    videoQualityMonitor: null,
    videoQualityLastStats: null,
    healthMonitor: null,
    healthLastStats: null,
    localAudioAvailable: true,
    localErrorMessage: "",
    acceptedIncomingCallId: "",
    muted: false,
    deafened: false,
    mutedBeforeDeafen: null,
    joined: false,
  });
  remoteCallStatus.muted = false;
  remoteCallStatus.deafened = false;

  mediaConn?.close();
  if (incomingMediaConn && incomingMediaConn !== mediaConn) {
    incomingMediaConn.close();
  }
  localStream?._rawVoiceStream?.getTracks().forEach((track) => track.stop());
  localStream?.getTracks().forEach((track) => stopMediaTrack(track));
  localCameraStream?.getTracks().forEach((track) => track.stop());
  remoteStream?.getTracks().forEach((track) => track.stop());
  resetVoiceProcessingState();
  if (videoQualityMonitor) {
    clearInterval(videoQualityMonitor);
  }
  callState.videoQualityMonitor = null;
  callState.videoQualityLastStats = null;
  localVoiceAudioContext?.close().catch(() => {});
  localVoiceAudioContext = null;
  resetRemoteVoiceProcessingState();
  stopLocalRingtone();
  clearRemoteAudio();
  refreshCallStage();
  refreshCallUi();
}

function applyLocalMuteState() {
  callState.localStream?.getAudioTracks().forEach((track) => {
    track.enabled = !callState.muted;
  });
  refreshCallStage();
}

function setCallMuted(muted) {
  callState.muted = Boolean(muted);
  applyLocalMuteState();
  refreshCallUi();
  sendLocalCallStatus();
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
  refreshCallStage();
  sendLocalCallStatus();
}

function sendLocalCallStatus() {
  if (!callState.peerId || callState.status === "idle") {
    return;
  }

  sendProtocolMessage(connections.get(callState.peerId), "call-status", {
    callId: callState.callId,
    muted: callState.muted,
    deafened: callState.deafened,
  });
}

function handleRemoteCallStatus(peerId, data) {
  if (callState.peerId !== peerId || callState.callId !== data.callId) {
    return;
  }

  remoteCallStatus.muted = Boolean(data.muted);
  remoteCallStatus.deafened = Boolean(data.deafened);
  refreshCallUi();
  refreshCallStage();
}

function handleRemoteCameraState(peerId, data) {
  if (callState.peerId !== peerId || callState.callId !== data.callId) {
    return;
  }

  callState.remoteCameraEnabled = Boolean(data.enabled);
  refreshCallStage();
}

function stopVoiceMeterLoop() {
  if (localVoiceMeterFrame) {
    cancelAnimationFrame(localVoiceMeterFrame);
    localVoiceMeterFrame = 0;
  }
}

function resetVoiceProcessingState() {
  stopVoiceMeterLoop();
  if (pendingVoiceSettingsReapply) {
    clearTimeout(pendingVoiceSettingsReapply);
    pendingVoiceSettingsReapply = null;
  }
  localVoiceNoiseFloor = 0.01;
  localVoiceGateIsOpen = false;
  localVoiceGateHoldUntil = 0;
  localVoiceGateNode = null;
  localVoiceBoostNode = null;
  localVoiceEqLowNode = null;
  localVoiceEqMidNode = null;
  localVoiceEqHighNode = null;
  localVoiceHighpassNode = null;
  localVoiceCompressorNode = null;
  localVoiceAnalyserNode = null;
  localVoiceProcessingContext = null;
  localVoiceMeterBuffer = null;
  refreshCallStage();
}

function getMicGateThreshold({ profile, mode, sensitivity, noiseFloor }) {
  const thresholdMin = profile === "custom" ? 0.0035 : 0.0048;
  const thresholdMax = profile === "custom" ? 0.038 : 0.032;

  if (mode === "auto") {
    const floor = Number.isFinite(noiseFloor) ? noiseFloor : 0.01;
    return Math.max(
      thresholdMin,
      Math.min(thresholdMax, floor * 1.75 + 0.0025),
    );
  }

  const normalized = Math.max(0, Math.min(100, Number(sensitivity) || 0)) / 100;
  return thresholdMax - normalized * (thresholdMax - thresholdMin);
}

function getMicNoiseReductionFactor() {
  normalizeAudioConfig();
  const value =
    appConfig.audio.micNoiseReduction ?? DEFAULT_MIC_NOISE_REDUCTION;
  return Math.max(0, Math.min(100, value)) / 100;
}

function getMicBoostGain() {
  normalizeAudioConfig();
  return Math.max(
    0,
    Math.min(2, (appConfig.audio.micBoost || DEFAULT_MIC_BOOST) / 100),
  );
}

function getMicEqValues() {
  normalizeAudioConfig();
  return {
    low: Math.max(-12, Math.min(12, Number(appConfig.audio.micEqLow) || 0)),
    mid: Math.max(-12, Math.min(12, Number(appConfig.audio.micEqMid) || 0)),
    high: Math.max(-12, Math.min(12, Number(appConfig.audio.micEqHigh) || 0)),
  };
}

function updateVoiceMeter() {
  if (
    !localVoiceAnalyserNode ||
    !localVoiceGateNode ||
    !localVoiceBoostNode ||
    !localVoiceProcessingContext
  ) {
    return;
  }

  const audio = appConfig.audio || {};
  if (audio.micProfile === "studio") {
    localVoiceGateNode.gain.setTargetAtTime(
      1,
      localVoiceProcessingContext.currentTime,
      0.01,
    );
    localVoiceBoostNode.gain.setTargetAtTime(
      1,
      localVoiceProcessingContext.currentTime,
      0.03,
    );
    localVoiceMeterFrame = requestAnimationFrame(updateVoiceMeter);
    return;
  }

  if (
    !localVoiceMeterBuffer ||
    localVoiceMeterBuffer.length !== localVoiceAnalyserNode.fftSize
  ) {
    localVoiceMeterBuffer = new Float32Array(localVoiceAnalyserNode.fftSize);
  }

  const buffer = localVoiceMeterBuffer;
  localVoiceAnalyserNode.getFloatTimeDomainData(buffer);

  let sumSquares = 0;
  for (const sample of buffer) {
    sumSquares += sample * sample;
  }

  const rms = Math.sqrt(sumSquares / buffer.length);
  if (audio.micMode === "auto") {
    if (rms < localVoiceNoiseFloor * 1.35) {
      localVoiceNoiseFloor = localVoiceNoiseFloor * 0.96 + rms * 0.04;
    } else {
      localVoiceNoiseFloor = localVoiceNoiseFloor * 0.998 + rms * 0.002;
    }
    localVoiceNoiseFloor = Math.max(
      0.0015,
      Math.min(0.04, localVoiceNoiseFloor),
    );
  }

  const noiseFloor =
    audio.micProfile === "custom"
      ? localVoiceNoiseFloor + getMicNoiseReductionFactor() * 0.012
      : localVoiceNoiseFloor;
  const threshold = getMicGateThreshold({
    profile: audio.micProfile,
    mode: audio.micMode,
    sensitivity: audio.micSensitivity,
    noiseFloor,
  });
  const openThreshold = threshold;
  const closeThreshold = Math.max(
    audio.micProfile === "custom" ? 0.0028 : 0.0038,
    threshold * 0.62,
  );
  const now = localVoiceProcessingContext.currentTime;
  if (rms >= openThreshold) {
    localVoiceGateIsOpen = true;
    localVoiceGateHoldUntil =
      now + (audio.micProfile === "custom" ? 0.24 : 0.2);
  } else if (localVoiceGateIsOpen && rms >= closeThreshold) {
    localVoiceGateHoldUntil =
      now + (audio.micProfile === "custom" ? 0.18 : 0.14);
  } else if (localVoiceGateIsOpen && now < localVoiceGateHoldUntil) {
    // Keep the gate open briefly so syllables do not get clipped.
  } else {
    localVoiceGateIsOpen = false;
  }

  const noiseReductionFactor = getMicNoiseReductionFactor();
  const closedGain =
    audio.micProfile === "custom" ? 0.18 - noiseReductionFactor * 0.1 : 0.12;
  const gateOpen = localVoiceGateIsOpen ? 1 : Math.max(0.06, closedGain);
  localVoiceGateNode.gain.setTargetAtTime(
    gateOpen,
    now,
    gateOpen > 0.5 ? 0.012 : 0.18,
  );
  localVoiceBoostNode.gain.setTargetAtTime(getMicBoostGain(), now, 0.03);
  refreshCallStage();

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
  const profile = appConfig.audio.micProfile;
  const audio = {
    echoCancellation: true,
    noiseSuppression: profile !== "studio",
    autoGainControl: profile === "voice-isolation",
    channelCount: { ideal: 1 },
    sampleRate: { ideal: 48000 },
    sampleSize: { ideal: 16 },
    latency: { ideal: 0.02 },
  };

  if (deviceId && deviceId !== "default") {
    audio.deviceId = { exact: deviceId };
  }

  return audio;
}

function createCameraVideoConstraints() {
  normalizeAudioConfig();
  const deviceId = appConfig.audio.cameraDeviceId;
  const video = {
    width: { ideal: CALL_CAMERA_WIDTH },
    height: { ideal: CALL_CAMERA_HEIGHT },
    frameRate: { ideal: 16, max: CALL_CAMERA_MAX_FRAMERATE },
  };

  if (deviceId && deviceId !== "default") {
    video.deviceId = { exact: deviceId };
  }

  return video;
}

function isUnavailableMediaDeviceError(error) {
  return ["NotFoundError", "DevicesNotFoundError", "OverconstrainedError"].includes(
    String(error?.name || ""),
  );
}

async function getUserMediaWithDeviceFallback(
  createConstraints,
  deviceConfigKey,
) {
  normalizeAudioConfig();
  const selectedDeviceId = appConfig.audio[deviceConfigKey];
  try {
    return await navigator.mediaDevices.getUserMedia(createConstraints());
  } catch (error) {
    if (
      !selectedDeviceId ||
      selectedDeviceId === "default" ||
      !isUnavailableMediaDeviceError(error)
    ) {
      throw error;
    }

    appConfig.audio[deviceConfigKey] = "default";
    saveAudioConfig();
    return navigator.mediaDevices.getUserMedia(createConstraints());
  }
}

function formatCameraError(error) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();
  const name = String(error?.name || "");

  if (name === "NotAllowedError") {
    return "Camera blocked";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No camera found";
  }
  if (
    name === "NotReadableError" ||
    message.includes("hardware resources") ||
    message.includes("0xc00d3704") ||
    code.includes("0xc00d3704")
  ) {
    return "Camera busy or unavailable";
  }
  if (name === "OverconstrainedError") {
    return "Selected camera unavailable";
  }

  return "Could not access your camera.";
}

function improveVoiceSdp(sdp = "") {
  const opusPayloads = Array.from(
    sdp.matchAll(/^a=rtpmap:(\d+) opus\/48000(?:\/\d+)?$/gim),
    (match) => match[1],
  );
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
      `maxaveragebitrate=${VOICE_AUDIO_BITRATE}`,
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
      `$1\r\na=fmtp:${payload} ${params.join(";")}`,
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
    if (
      sender.track?.kind !== "audio" ||
      !sender.getParameters ||
      !sender.setParameters
    ) {
      continue;
    }

    const parameters = sender.getParameters();
    parameters.encodings = parameters.encodings?.length
      ? parameters.encodings
      : [{}];
    parameters.encodings[0].maxBitrate = VOICE_AUDIO_BITRATE;
    parameters.encodings[0].priority = "high";
    await sender.setParameters(parameters).catch(() => {});
  }
}

async function applyVideoQualityProfileToConnection(
  mediaConn,
  profile = getCallVideoQualityProfile(),
) {
  const peerConnection = mediaConn?.peerConnection;
  if (!peerConnection?.getSenders) {
    return;
  }

  for (const sender of peerConnection.getSenders()) {
    if (
      sender.track?.kind !== "video" ||
      !sender.getParameters ||
      !sender.setParameters
    ) {
      continue;
    }

    const parameters = sender.getParameters();
    parameters.degradationPreference = profile.degradationPreference;
    parameters.encodings = parameters.encodings?.length
      ? parameters.encodings
      : [{}];
    parameters.encodings[0].maxBitrate = Math.max(
      CALL_VIDEO_MIN_BITRATE,
      Math.min(CALL_VIDEO_FIXED_MAX_BITRATE, profile.maxBitrate),
    );
    parameters.encodings[0].maxFramerate = Math.min(
      CALL_CAMERA_MAX_FRAMERATE,
      profile.maxFramerate,
    );
    parameters.encodings[0].scaleResolutionDownBy = Math.max(
      1,
      profile.scaleResolutionDownBy,
    );
    parameters.encodings[0].networkPriority = "high";
    await sender.setParameters(parameters).catch(() => {});
    if (sender.track) {
      sender.track.contentHint = "motion";
    }
  }
}

async function applyVideoQualityProfileToActiveCall(
  profile = getCallVideoQualityProfile(),
) {
  callState.videoQualityProfile = profile.name;
  const activeMediaConns = [callState.mediaConn, callState.incomingMediaConn]
    .filter(Boolean)
    .filter((conn, index, list) => list.indexOf(conn) === index);

  for (const mediaConn of activeMediaConns) {
    await applyVideoQualityProfileToConnection(mediaConn, profile);
  }
}

function stopVideoQualityMonitor() {
  if (callState.videoQualityMonitor) {
    clearInterval(callState.videoQualityMonitor);
    callState.videoQualityMonitor = null;
  }
  callState.videoQualityLastStats = null;
}

function chooseAdaptiveVideoProfile({
  packetsLost = 0,
  packetsSent = 0,
  availableOutgoingBitrate = 0,
  roundTripTime = 0,
  actualBitrate = 0,
} = {}) {
  const lossRatio =
    packetsSent > 0 ? packetsLost / Math.max(1, packetsSent + packetsLost) : 0;
  const availableKbps = availableOutgoingBitrate / 1000;
  const actualKbps = actualBitrate / 1000;
  const rttMs = roundTripTime * 1000;

  if (
    lossRatio > 0.08 ||
    rttMs > 380 ||
    (availableKbps > 0 && availableKbps < 220) ||
    (actualKbps > 0 && actualKbps < 140)
  ) {
    return "low";
  }

  if (
    lossRatio > 0.035 ||
    rttMs > 220 ||
    (availableKbps > 0 && availableKbps < 420) ||
    (actualKbps > 0 && actualKbps < 240)
  ) {
    return "medium";
  }

  return "high";
}

async function sampleAdaptiveVideoQuality() {
  if (!callState.localCameraEnabled || callState.status === "idle") {
    return;
  }

  const mediaConn = [callState.mediaConn, callState.incomingMediaConn].find(
    (conn) => conn?.peerConnection?.getStats,
  );
  const peerConnection = mediaConn?.peerConnection;
  if (!peerConnection) {
    return;
  }

  try {
    const stats = await peerConnection.getStats();
    let outboundVideo = null;
    let selectedPair = null;

    for (const report of stats.values()) {
      if (
        report.type === "outbound-rtp" &&
        report.kind === "video" &&
        !report.isRemote
      ) {
        outboundVideo = report;
      }
      if (
        report.type === "candidate-pair" &&
        report.state === "succeeded" &&
        report.nominated
      ) {
        selectedPair = report;
      }
    }

    if (!outboundVideo) {
      return;
    }

    const previous = callState.videoQualityLastStats;
    let actualBitrate = 0;
    if (previous?.timestamp && previous.bytesSent != null) {
      const elapsedMs = outboundVideo.timestamp - previous.timestamp;
      const bytesDelta = outboundVideo.bytesSent - previous.bytesSent;
      if (elapsedMs > 0 && bytesDelta >= 0) {
        actualBitrate = Math.round((bytesDelta * 8 * 1000) / elapsedMs);
      }
    }

    callState.videoQualityLastStats = {
      timestamp: outboundVideo.timestamp,
      bytesSent: outboundVideo.bytesSent,
    };

    const nextProfile = chooseAdaptiveVideoProfile({
      packetsLost: outboundVideo.packetsLost || 0,
      packetsSent: outboundVideo.packetsSent || 0,
      availableOutgoingBitrate: selectedPair?.availableOutgoingBitrate || 0,
      roundTripTime: selectedPair?.currentRoundTripTime || 0,
      actualBitrate,
    });

    if (nextProfile !== callState.videoQualityProfile) {
      await applyVideoQualityProfileToActiveCall(
        getCallVideoQualityProfile(nextProfile),
      );
    }
  } catch {
    // Ignore transient getStats errors during reconnects.
  }
}

function startVideoQualityMonitor() {
  stopVideoQualityMonitor();
  callState.videoQualityMonitor = setInterval(() => {
    sampleAdaptiveVideoQuality().catch(() => {});
  }, CALL_VIDEO_QUALITY_POLL_MS);
}

function getActiveCallPeerConnections() {
  return [callState.mediaConn, callState.incomingMediaConn]
    .map((mediaConn) => mediaConn?.peerConnection)
    .filter(Boolean)
    .filter(
      (peerConnection, index, list) => list.indexOf(peerConnection) === index,
    );
}

function isPeerConnectionDisconnected(peerConnection) {
  return (
    ["disconnected", "failed", "closed"].includes(
      peerConnection.connectionState,
    ) ||
    ["disconnected", "failed", "closed"].includes(
      peerConnection.iceConnectionState,
    )
  );
}

function stopCallHealthMonitor() {
  if (callState.healthMonitor) {
    clearInterval(callState.healthMonitor);
    callState.healthMonitor = null;
  }
  callState.healthLastStats = null;
}

function endCallFromHealthMonitor(message = "Voice connection lost.") {
  if (callState.status === "idle") {
    return;
  }

  endVoiceCall({ notifyPeer: true, message });
}

function chooseCallHealthQuality({
  disconnected = false,
  latencyMs = null,
  lossRatio = 0,
  staleFor = 0,
} = {}) {
  if (disconnected || staleFor >= CALL_MEDIA_DISCONNECTED_TIMEOUT_MS) {
    return "bad";
  }

  if (
    lossRatio >= 0.08 ||
    staleFor >= CALL_MEDIA_DISCONNECTED_TIMEOUT_MS / 2 ||
    (latencyMs != null && latencyMs >= 320)
  ) {
    return "unstable";
  }

  return "good";
}

async function sampleCallHealth() {
  if (callState.status === "idle" || !callState.peerId || !callState.callId) {
    stopCallHealthMonitor();
    return;
  }

  const peerConnections = getActiveCallPeerConnections();
  if (peerConnections.length === 0) {
    return;
  }

  const now = Date.now();
  const previous = callState.healthLastStats || {};
  const next = {
    lastMediaProgressAt: previous.lastMediaProgressAt || now,
    mediaDisconnectedSince: null,
    bytesReceived: previous.bytesReceived || 0,
    packetsReceived: previous.packetsReceived || 0,
    statsFailures: 0,
    quality: previous.quality || "unknown",
    latencyMs: previous.latencyMs ?? null,
  };

  let disconnected = false;
  let inboundBytes = 0;
  let inboundPackets = 0;
  let inboundPacketsLost = 0;
  let latencyMs = null;
  let sawInboundRtp = false;

  try {
    for (const peerConnection of peerConnections) {
      disconnected = disconnected || isPeerConnectionDisconnected(peerConnection);
      const stats = await peerConnection.getStats();
      for (const report of stats.values()) {
        if (
          report.type === "candidate-pair" &&
          report.state === "succeeded" &&
          report.nominated &&
          typeof report.currentRoundTripTime === "number"
        ) {
          latencyMs = Math.round(report.currentRoundTripTime * 1000);
        }
        if (
          report.type === "inbound-rtp" &&
          !report.isRemote &&
          ["audio", "video"].includes(report.kind)
        ) {
          sawInboundRtp = true;
          inboundBytes += Number(report.bytesReceived || 0);
          inboundPackets += Number(report.packetsReceived || 0);
          inboundPacketsLost += Number(report.packetsLost || 0);
        }
      }
    }
  } catch {
    next.statsFailures = (previous.statsFailures || 0) + 1;
    callState.healthLastStats = next;
    setCallHealthUi({
      quality: next.statsFailures >= 2 ? "unstable" : next.quality,
      latencyMs: next.latencyMs,
      visible: callState.status === "active",
    });
    if (next.statsFailures >= CALL_STATS_FAILURE_LIMIT) {
      endCallFromHealthMonitor();
    }
    return;
  }

  if (
    sawInboundRtp &&
    (inboundBytes > next.bytesReceived || inboundPackets > next.packetsReceived)
  ) {
    next.lastMediaProgressAt = now;
  }

  next.bytesReceived = Math.max(next.bytesReceived, inboundBytes);
  next.packetsReceived = Math.max(next.packetsReceived, inboundPackets);

  if (disconnected) {
    next.mediaDisconnectedSince = previous.mediaDisconnectedSince || now;
  }

  callState.healthLastStats = next;

  const disconnectedFor =
    next.mediaDisconnectedSince == null ? 0 : now - next.mediaDisconnectedSince;
  const staleFor = now - next.lastMediaProgressAt;
  const totalInboundPackets = inboundPackets + inboundPacketsLost;
  const lossRatio =
    totalInboundPackets > 0 ? inboundPacketsLost / totalInboundPackets : 0;
  next.latencyMs = latencyMs;
  next.quality = chooseCallHealthQuality({
    disconnected,
    latencyMs,
    lossRatio,
    staleFor,
  });

  setCallHealthUi({
    quality: next.quality,
    latencyMs: next.latencyMs,
    visible: callState.status === "active",
  });

  if (disconnectedFor >= CALL_MEDIA_DISCONNECTED_TIMEOUT_MS) {
    endCallFromHealthMonitor();
    return;
  }

  if (sawInboundRtp && disconnected && staleFor >= CALL_MEDIA_STALE_TIMEOUT_MS) {
    endCallFromHealthMonitor();
  }
}

function startCallHealthMonitor() {
  stopCallHealthMonitor();
  callState.healthLastStats = {
    lastMediaProgressAt: Date.now(),
    mediaDisconnectedSince: null,
    bytesReceived: 0,
    packetsReceived: 0,
    statsFailures: 0,
    quality: "unknown",
    latencyMs: null,
  };
  setCallHealthUi({ quality: "unknown", visible: callState.status === "active" });
  callState.healthMonitor = setInterval(() => {
    sampleCallHealth().catch(() => {});
  }, CALL_HEALTH_POLL_MS);
}

function attachRemoteStreamHealthHandlers(stream, peerId, callId) {
  for (const track of stream.getTracks()) {
    track.addEventListener("ended", () => {
      if (
        callState.peerId !== peerId ||
        callState.callId !== callId ||
        callState.remoteStream !== stream
      ) {
        return;
      }

      const hasLiveTrack = stream
        .getTracks()
        .some((item) => item.readyState === "live");
      if (!hasLiveTrack) {
        endVoiceCall({
          notifyPeer: true,
          message: "Voice connection lost.",
        });
      }
    });
  }
}

async function getVoiceStream() {
  const captureGeneration = ++voiceCaptureGeneration;
  const rawStream = await getUserMediaWithDeviceFallback(
    () => ({
      audio: createVoiceAudioConstraints(),
      video: false,
    }),
    "inputDeviceId",
  );
  if (captureGeneration !== voiceCaptureGeneration) {
    rawStream.getTracks().forEach((track) => track.stop());
    const error = new Error("Voice capture was superseded.");
    error.name = "AbortError";
    throw error;
  }
  await refreshAudioDevices();
  if (captureGeneration !== voiceCaptureGeneration) {
    rawStream.getTracks().forEach((track) => track.stop());
    const error = new Error("Voice capture was superseded.");
    error.name = "AbortError";
    throw error;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (typeof AudioContextClass !== "function") {
    return rawStream;
  }

  let voiceAudioContext = null;
  try {
    resetVoiceProcessingState();
    localVoiceAudioContext?.close().catch(() => {});
    voiceAudioContext = new AudioContextClass();
    localVoiceAudioContext = voiceAudioContext;
    localVoiceProcessingContext = localVoiceAudioContext;
    await localVoiceAudioContext.resume().catch(() => {});
    if (captureGeneration !== voiceCaptureGeneration) {
      const error = new Error("Voice capture was superseded.");
      error.name = "AbortError";
      throw error;
    }
    const source = localVoiceAudioContext.createMediaStreamSource(rawStream);
    const destination = localVoiceAudioContext.createMediaStreamDestination();
    const profile = appConfig.audio.micProfile;
    if (profile === "studio") {
      source.connect(destination);
      localVoiceAnalyserNode = null;
      localVoiceGateNode = null;
      localVoiceCompressorNode = null;
      localVoiceBoostNode = null;
      localVoiceEqLowNode = null;
      localVoiceEqMidNode = null;
      localVoiceEqHighNode = null;
      localVoiceHighpassNode = null;
    } else {
      const highpass = localVoiceAudioContext.createBiquadFilter();
      const analyser = localVoiceAudioContext.createAnalyser();
      const compressor = localVoiceAudioContext.createDynamicsCompressor();
      const boostNode = localVoiceAudioContext.createGain();
      const gateNode = localVoiceAudioContext.createGain();
      const noiseReduction =
        appConfig.audio.micNoiseReduction ?? DEFAULT_MIC_NOISE_REDUCTION;
      const noiseReductionFactor =
        Math.max(0, Math.min(100, noiseReduction)) / 100;
      const eq = getMicEqValues();
      const eqLow = localVoiceAudioContext.createBiquadFilter();
      const eqMid = localVoiceAudioContext.createBiquadFilter();
      const eqHigh = localVoiceAudioContext.createBiquadFilter();

      highpass.type = "highpass";
      highpass.frequency.value =
        profile === "voice-isolation" ? 85 : 70 + noiseReductionFactor * 30;
      highpass.Q.value = 0.707;
      eqLow.type = "lowshelf";
      eqLow.frequency.value = 180;
      eqLow.gain.value = eq.low;
      eqMid.type = "peaking";
      eqMid.frequency.value = 1100;
      eqMid.Q.value = 0.9;
      eqMid.gain.value = eq.mid;
      eqHigh.type = "highshelf";
      eqHigh.frequency.value = 4500;
      eqHigh.gain.value = eq.high;
      analyser.fftSize = VOICE_METER_FFT;
      compressor.threshold.value =
        profile === "voice-isolation" ? -26 : -22 - noiseReductionFactor * 5;
      compressor.knee.value = profile === "voice-isolation" ? 20 : 16;
      compressor.ratio.value =
        profile === "voice-isolation" ? 2.8 : 2.2 + noiseReductionFactor;
      compressor.attack.value = 0.003;
      compressor.release.value =
        profile === "voice-isolation"
          ? 0.18
          : 0.24 + noiseReductionFactor * 0.04;
      gateNode.gain.value = profile === "custom" ? 0.12 : 0.1;
      boostNode.gain.value = getMicBoostGain();

      source.connect(highpass);
      highpass.connect(analyser);
      analyser.connect(eqLow);
      eqLow.connect(eqMid);
      eqMid.connect(eqHigh);
      eqHigh.connect(gateNode);
      gateNode.connect(compressor);
      compressor.connect(boostNode);
      boostNode.connect(destination);

      localVoiceAnalyserNode = analyser;
      localVoiceGateNode = gateNode;
      localVoiceCompressorNode = compressor;
      localVoiceBoostNode = boostNode;
      localVoiceEqLowNode = eqLow;
      localVoiceEqMidNode = eqMid;
      localVoiceEqHighNode = eqHigh;
      localVoiceHighpassNode = highpass;
      localVoiceNoiseFloor = 0.01;
      localVoiceMeterBuffer = new Float32Array(analyser.fftSize);
      localVoiceGateIsOpen = false;
      localVoiceGateHoldUntil = 0;
      startVoiceMeterLoop();
    }
    destination.stream._rawVoiceStream = rawStream;
    return destination.stream;
  } catch (error) {
    if (captureGeneration !== voiceCaptureGeneration) {
      voiceAudioContext?.close().catch(() => {});
      rawStream.getTracks().forEach((track) => track.stop());
      throw error;
    }
    resetVoiceProcessingState();
    voiceAudioContext?.close().catch(() => {});
    if (localVoiceAudioContext === voiceAudioContext) {
      localVoiceAudioContext = null;
    }
    return rawStream;
  }
}

async function createCallLocalStream() {
  let audioStream = null;
  let audioErrorMessage = "";

  try {
    audioStream = await getVoiceStream();
  } catch (error) {
    audioErrorMessage = formatMicrophoneError(error);
  }

  const placeholderVideoTrack = createPlaceholderVideoTrack();
  const tracks = [
    ...(audioStream?.getAudioTracks?.() || []),
    ...(placeholderVideoTrack ? [placeholderVideoTrack] : []),
  ];

  if (tracks.length === 0) {
    throw new Error(
      audioErrorMessage || "Could not create a local call stream.",
    );
  }

  const stream = new MediaStream(tracks);
  if (audioStream?._rawVoiceStream) {
    stream._rawVoiceStream = audioStream._rawVoiceStream;
  }
  return {
    stream,
    audioAvailable: Boolean(audioStream?.getAudioTracks?.().length),
    audioErrorMessage,
  };
}

async function replaceOutgoingVideoTrack(nextTrack) {
  const activeMediaConns = [callState.mediaConn, callState.incomingMediaConn]
    .filter(Boolean)
    .filter((conn, index, list) => list.indexOf(conn) === index);

  for (const mediaConn of activeMediaConns) {
    const peerConnection = mediaConn?.peerConnection;
    if (!peerConnection?.getSenders) {
      continue;
    }

    for (const sender of peerConnection.getSenders()) {
      if (
        sender.track?.kind !== "video" ||
        typeof sender.replaceTrack !== "function"
      ) {
        continue;
      }

      await sender.replaceTrack(nextTrack).catch(() => {});
    }
  }

  await applyVideoQualityProfileToActiveCall(getCallVideoQualityProfile());
}

function sendLocalCameraState() {
  if (!callState.peerId || callState.status === "idle") {
    return;
  }

  sendProtocolMessage(connections.get(callState.peerId), "camera-state", {
    callId: callState.callId,
    enabled: callState.localCameraEnabled,
  });
}

async function setLocalCameraEnabled(enabled) {
  if (!callState.localStream || callState.status === "idle") {
    return;
  }

  const peerId = callState.peerId;
  const callId = callState.callId;
  const localStream = callState.localStream;
  const nextEnabled = Boolean(enabled);
  const currentVideoTrack = localStream.getVideoTracks()[0] || null;
  let replacementTrack = null;
  let cameraStream = null;

  try {
    if (nextEnabled) {
      cameraStream = await getUserMediaWithDeviceFallback(
        () => ({
          audio: false,
          video: createCameraVideoConstraints(),
        }),
        "cameraDeviceId",
      );
      replacementTrack = cameraStream.getVideoTracks()[0] || null;
      if (!replacementTrack) {
        cameraStream.getTracks().forEach((track) => track.stop());
        throw new Error("No camera track available.");
      }
    } else {
      replacementTrack = createPlaceholderVideoTrack();
      if (!replacementTrack) {
        throw new Error("Could not disable your camera.");
      }
    }

    if (
      !isCurrentCallSession(peerId, callId) ||
      callState.localStream !== localStream
    ) {
      cameraStream?.getTracks().forEach((track) => track.stop());
      stopMediaTrack(replacementTrack);
      return;
    }

    await replaceOutgoingVideoTrack(replacementTrack);
    if (
      !isCurrentCallSession(peerId, callId) ||
      callState.localStream !== localStream
    ) {
      cameraStream?.getTracks().forEach((track) => track.stop());
      stopMediaTrack(replacementTrack);
      return;
    }
    if (currentVideoTrack) {
      localStream.removeTrack(currentVideoTrack);
    }
    localStream.addTrack(replacementTrack);
    stopMediaTrack(currentVideoTrack);
    stopLocalCameraCapture();
    callState.localCameraStream = cameraStream;
    callState.localCameraEnabled = nextEnabled;
    await applyVideoQualityProfileToActiveCall(getCallVideoQualityProfile());
    if (nextEnabled) {
      startVideoQualityMonitor();
      sampleAdaptiveVideoQuality().catch(() => {});
    } else {
      stopVideoQualityMonitor();
    }
    refreshCallUi();
    sendLocalCameraState();
  } catch (error) {
    cameraStream?.getTracks().forEach((track) => track.stop());
    if (!isCurrentCallSession(peerId, callId)) {
      return;
    }
    const message = nextEnabled
      ? formatCameraError(error)
      : error?.message || "Could not disable your camera.";
    setStatus("offline", message);
    addSystemMessage(message);
  }
}

async function applyVoiceSettingsToActiveCall() {
  if (!callState.localStream || callState.status === "idle") {
    return;
  }

  const peerId = callState.peerId;
  const callId = callState.callId;
  const localStream = callState.localStream;
  let nextStream = null;
  try {
    nextStream = await getVoiceStream();
  } catch (error) {
    if (!isCurrentCallSession(peerId, callId)) {
      return;
    }
    callState.localAudioAvailable = false;
    callState.localErrorMessage = formatMicrophoneError(error);
    refreshCallStage();
    return;
  }

  if (
    !isCurrentCallSession(peerId, callId) ||
    callState.localStream !== localStream
  ) {
    stopCallStreamCandidate(nextStream);
    return;
  }

  const nextTrack = nextStream.getAudioTracks()[0];
  if (!nextTrack) {
    nextStream.getTracks().forEach((track) => track.stop());
    return;
  }

  const activeMediaConns = [callState.mediaConn, callState.incomingMediaConn]
    .filter(Boolean)
    .filter((conn, index, list) => list.indexOf(conn) === index);
  let attemptedReplacement = false;
  let replacedAny = false;

  for (const mediaConn of activeMediaConns) {
    const peerConnection = mediaConn?.peerConnection;
    if (!peerConnection?.getSenders) {
      continue;
    }

    for (const sender of peerConnection.getSenders()) {
      if (
        sender.track?.kind !== "audio" ||
        typeof sender.replaceTrack !== "function"
      ) {
        continue;
      }

      attemptedReplacement = true;
      try {
        await sender.replaceTrack(nextTrack);
        replacedAny = true;
      } catch {
        // Keep the existing call audio alive if the swap fails.
      }
    }
  }

  if (
    !isCurrentCallSession(peerId, callId) ||
    callState.localStream !== localStream
  ) {
    stopCallStreamCandidate(nextStream);
    return;
  }

  if (attemptedReplacement && !replacedAny) {
    nextStream.getTracks().forEach((track) => track.stop());
    return;
  }

  const previousStream = localStream;
  const currentVideoTrack = previousStream?.getVideoTracks?.()[0] || null;
  const combinedStream = new MediaStream([
    ...nextStream.getAudioTracks(),
    ...(currentVideoTrack ? [currentVideoTrack] : []),
  ]);
  combinedStream._rawVoiceStream = nextStream._rawVoiceStream;
  callState.localStream = combinedStream;
  callState.localAudioAvailable = true;
  callState.localErrorMessage = "";
  applyLocalMuteState();
  previousStream?._rawVoiceStream?.getTracks().forEach((track) => track.stop());
  previousStream?.getAudioTracks().forEach((track) => track.stop());
  remoteAudio.muted = callState.deafened;
}

function attachMediaConnectionHandlers(mediaConn, peerId, callId) {
  callState.mediaConn = mediaConn;
  tuneOutgoingAudio(mediaConn);
  applyVideoQualityProfileToConnection(
    mediaConn,
    getCallVideoQualityProfile(),
  ).catch(() => {});
  startCallHealthMonitor();

  mediaConn.on("stream", async (stream) => {
    if (callState.peerId !== peerId || callState.callId !== callId) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    if (callState.remoteStream && callState.remoteStream !== stream) {
      callState.remoteStream.getTracks().forEach((track) => track.stop());
    }
    callState.remoteStream = stream;
    attachRemoteStreamHealthHandlers(stream, peerId, callId);
    remoteAudio.srcObject = stream;
    setRemoteVolume(getPeerPlaybackVolume(peerId), { persist: false });
    remoteAudio.muted = callState.deafened;
    await applyAudioOutputDevice();
    if (
      !isCurrentCallSession(peerId, callId) ||
      callState.remoteStream !== stream
    ) {
      if (remoteAudio.srcObject === stream) {
        remoteAudio.srcObject = null;
      }
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    remoteAudio.play().catch(() => {});
    startRemoteVoiceMeter(stream).catch(() => {});
    if (!callState.joined) {
      callState.joined = true;
      playCallJoinSound();
    }
    setCallState("active");
    sendLocalCallStatus();
    sendLocalCameraState();
    if (callState.localCameraEnabled) {
      startVideoQualityMonitor();
      sampleAdaptiveVideoQuality().catch(() => {});
    }
    setStatus(
      "online",
      `Voice call with ${getPeerLabel(peerId, connections.get(peerId))}`,
    );
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

async function tuneScreenShareConnection(
  mediaConn,
  bitrate = getScreenStreamBaseBitrate(),
) {
  const peerConnection = mediaConn?.peerConnection;
  if (!peerConnection?.getSenders) {
    return;
  }

  for (const sender of peerConnection.getSenders()) {
    if (
      sender.track?.kind !== "video" ||
      !sender.getParameters ||
      !sender.setParameters
    ) {
      continue;
    }

    const parameters = sender.getParameters();
    parameters.degradationPreference =
      bitrate < getScreenStreamBaseBitrate()
        ? "maintain-framerate"
        : "balanced";
    parameters.encodings = parameters.encodings?.length
      ? parameters.encodings
      : [{}];
    parameters.encodings[0].maxBitrate = Math.max(
      SCREEN_STREAM_MIN_BITRATE,
      bitrate,
    );
    parameters.encodings[0].maxFramerate = screenShareState.fps;
    parameters.encodings[0].networkPriority = "high";
    await sender.setParameters(parameters).catch(() => {});
    if (sender.track) {
      sender.track.contentHint = "detail";
    }
  }
}

function tuneIncomingScreenShareConnection(mediaConn) {
  const peerConnection = mediaConn?.peerConnection;
  if (!peerConnection?.getReceivers) {
    return;
  }

  for (const receiver of peerConnection.getReceivers()) {
    if (receiver.track?.kind !== "video") {
      continue;
    }

    try {
      receiver.playoutDelayHint = SCREEN_STREAM_BUFFER_DELAY_SECONDS;
    } catch {
      // Some WebRTC builds expose the property as read-only.
    }
  }
}

function stopScreenQualityMonitor() {
  if (screenShareState.qualityMonitor) {
    clearInterval(screenShareState.qualityMonitor);
    screenShareState.qualityMonitor = null;
  }
  screenShareState.qualityLastStats = null;
}

async function sampleAdaptiveScreenQuality() {
  const mediaConn = screenShareState.localMediaConn;
  const peerConnection = mediaConn?.peerConnection;
  if (!screenShareState.localStream || !peerConnection?.getStats) {
    return;
  }

  try {
    const stats = await peerConnection.getStats();
    let outboundVideo = null;
    let selectedPair = null;

    for (const report of stats.values()) {
      if (
        report.type === "outbound-rtp" &&
        report.kind === "video" &&
        !report.isRemote
      ) {
        outboundVideo = report;
      }
      if (
        report.type === "candidate-pair" &&
        report.state === "succeeded" &&
        report.nominated
      ) {
        selectedPair = report;
      }
    }

    if (!outboundVideo) {
      return;
    }

    const previous = screenShareState.qualityLastStats;
    let actualBitrate = 0;
    if (previous?.timestamp && previous.bytesSent != null) {
      const elapsedMs = outboundVideo.timestamp - previous.timestamp;
      const bytesDelta = outboundVideo.bytesSent - previous.bytesSent;
      if (elapsedMs > 0 && bytesDelta >= 0) {
        actualBitrate = Math.round((bytesDelta * 8 * 1000) / elapsedMs);
      }
    }

    screenShareState.qualityLastStats = {
      timestamp: outboundVideo.timestamp,
      bytesSent: outboundVideo.bytesSent,
    };

    const baseBitrate = getScreenStreamBaseBitrate();
    const lossRatio =
      outboundVideo.packetsSent > 0
        ? (outboundVideo.packetsLost || 0) /
          Math.max(
            1,
            outboundVideo.packetsSent + (outboundVideo.packetsLost || 0),
          )
        : 0;
    const available = selectedPair?.availableOutgoingBitrate || 0;
    const rttMs = (selectedPair?.currentRoundTripTime || 0) * 1000;
    const congestion =
      lossRatio > 0.06 ||
      rttMs > 340 ||
      (available > 0 && available < baseBitrate * 0.72) ||
      (actualBitrate > 0 && actualBitrate < baseBitrate * 0.45);
    const nextBitrate = congestion
      ? Math.round(baseBitrate * 0.58)
      : baseBitrate;
    await tuneScreenShareConnection(mediaConn, nextBitrate);
  } catch {
    // getStats can fail while a WebRTC sender is closing or changing tracks.
  }
}

function startScreenQualityMonitor() {
  stopScreenQualityMonitor();
  screenShareState.qualityMonitor = setInterval(() => {
    sampleAdaptiveScreenQuality().catch(() => {});
  }, SCREEN_STREAM_QUALITY_POLL_MS);
}

async function getScreenCaptureStream(sourceId, options) {
  if (sourceId === "display-media") {
    return platformApi.getDisplayMedia({
      ...options,
      profile: SCREEN_STREAM_PROFILES[normalizeScreenQuality(options?.quality)],
    });
  }

  const constraints = getScreenStreamConstraints(sourceId, options);
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    if (options?.audio) {
      return navigator.mediaDevices.getUserMedia(
        getScreenStreamConstraints(sourceId, { ...options, audio: false }),
      );
    }
    throw error;
  }
}

function sendScreenShareState(extra = {}) {
  if (!callState.peerId || callState.status === "idle") {
    return;
  }

  sendProtocolMessage(connections.get(callState.peerId), "screen-share-state", {
    callId: callState.callId,
    active: Boolean(screenShareState.localStream),
    sourceName: screenShareState.sourceName,
    quality: screenShareState.quality,
    fps: screenShareState.fps,
    audio: screenShareState.audioEnabled,
    viewerWatching: screenShareState.remoteViewerWatching,
    ...extra,
  });
}

function stopLocalScreenShare({ notifyPeer = true, message = "" } = {}) {
  stopScreenQualityMonitor();
  const mediaConn = screenShareState.localMediaConn;
  const stream = screenShareState.localStream;

  screenShareState.localMediaConn = null;
  screenShareState.localStream = null;
  screenShareState.sourceId = "";
  screenShareState.sourceName = "";
  screenShareState.audioEnabled = false;
  screenShareState.remoteViewerWatching = true;
  if (streamFullscreenTarget === "local") {
    streamFullscreenTarget = "";
  }
  mediaConn?.close();
  stream?.getTracks().forEach((track) => track.stop());

  if (notifyPeer) {
    sendScreenShareState({ active: false });
  }
  if (message) {
    addSystemMessage(message);
  }
  refreshCallUi();
  refreshCallStage();
}

function stopRemoteScreenShare({ message = "" } = {}) {
  const mediaConn = screenShareState.remoteMediaConn;
  const stream = screenShareState.remoteStream;

  screenShareState.remoteMediaConn = null;
  screenShareState.remoteStream = null;
  screenShareState.remoteAudioEnabled = false;
  screenShareState.viewerWatching = true;
  screenShareState.hiddenByViewer = false;
  if (streamFullscreenTarget === "remote") {
    streamFullscreenTarget = "";
  }
  mediaConn?.close();
  stream?.getTracks().forEach((track) => track.stop());
  if (message) {
    addSystemMessage(message);
  }
  refreshCallUi();
  refreshCallStage();
}

function setRemoteScreenWatching(watching) {
  screenShareState.viewerWatching = Boolean(watching);
  screenShareState.hiddenByViewer = !screenShareState.viewerWatching;
  if (!screenShareState.viewerWatching && streamFullscreenTarget === "remote") {
    streamFullscreenTarget = "";
  }
  if (screenShareState.remoteStream) {
    screenShareState.remoteStream.getTracks().forEach((track) => {
      track.enabled = screenShareState.viewerWatching;
    });
  }
  if (callState.peerId && callState.callId) {
    sendProtocolMessage(
      connections.get(callState.peerId),
      "screen-watch-state",
      {
        callId: callState.callId,
        watching: screenShareState.viewerWatching,
      },
    );
  }
  refreshCallStage();
}

async function startLocalScreenShare(
  source,
  {
    quality = screenShareState.quality,
    fps = screenShareState.fps,
    audio = screenShareState.audioEnabled,
  } = {},
) {
  if (!peer?.open || callState.status === "idle" || !callState.peerId) {
    return;
  }

  const peerId = callState.peerId;
  const callId = callState.callId;
  const callPeer = peer;
  const conn = connections.get(peerId);
  if (!conn?.open) {
    setStatus("offline", "The active peer is not ready yet.");
    return;
  }

  let stream = null;
  try {
    stream = await getScreenCaptureStream(source.id, { quality, fps, audio });
    if (
      !isCurrentCallSession(peerId, callId) ||
      peer !== callPeer ||
      connections.get(peerId) !== conn ||
      !conn.open
    ) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    const videoTrack = stream.getVideoTracks()[0] || null;
    if (!videoTrack) {
      throw new Error("No screen video track available.");
    }
    videoTrack.contentHint = "detail";
    videoTrack.addEventListener(
      "ended",
      () => {
        if (screenShareState.localStream === stream) {
          stopLocalScreenShare({
            notifyPeer: true,
            message: "Screen stream stopped.",
          });
        }
      },
      { once: true },
    );

    stopLocalScreenShare({ notifyPeer: false });
    screenShareState.localStream = stream;
    screenShareState.sourceId = source.id;
    screenShareState.sourceName = source.name || "Screen";
    screenShareState.quality = normalizeScreenQuality(quality);
    screenShareState.fps = normalizeScreenFps(fps);
    screenShareState.audioEnabled = Boolean(stream.getAudioTracks().length);
    screenShareState.remoteViewerWatching = true;

    const mediaConn = callPeer.call(peerId, stream, {
      metadata: {
        ...createChatMetadata(),
        kind: "screen",
        callId,
        sourceName: screenShareState.sourceName,
        quality: screenShareState.quality,
        fps: screenShareState.fps,
        audio: screenShareState.audioEnabled,
      },
    });
    screenShareState.localMediaConn = mediaConn;
    mediaConn.on("close", () => {
      if (screenShareState.localMediaConn === mediaConn) {
        stopLocalScreenShare({ notifyPeer: false });
      }
    });
    mediaConn.on("error", (error) => {
      if (screenShareState.localMediaConn === mediaConn) {
        addSystemMessage(`Screen stream error: ${error.message}`);
        stopLocalScreenShare({ notifyPeer: true });
      }
    });
    await tuneScreenShareConnection(mediaConn);
    if (
      !isCurrentCallSession(peerId, callId) ||
      screenShareState.localMediaConn !== mediaConn
    ) {
      mediaConn.close();
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    startScreenQualityMonitor();
    sendScreenShareState({ active: true });
    addSystemMessage(`Streaming ${screenShareState.sourceName}.`);
    refreshCallUi();
    refreshCallStage();
  } catch (error) {
    stream?.getTracks().forEach((track) => track.stop());
    const message = formatScreenCaptureError(error);
    setStatus("offline", message);
    addSystemMessage(message);
  }
}

function handleIncomingScreenShare(mediaConn) {
  const peerId = mediaConn.peer;
  const callId = mediaConn.metadata?.callId;
  if (
    callState.peerId !== peerId ||
    callState.callId !== callId ||
    callState.status === "idle"
  ) {
    rejectIncomingMediaCall(mediaConn);
    return;
  }

  stopRemoteScreenShare();
  screenShareState.remoteMediaConn = mediaConn;
  screenShareState.remoteAudioEnabled = Boolean(mediaConn.metadata?.audio);
  mediaConn.answer();
  tuneIncomingScreenShareConnection(mediaConn);
  setTimeout(() => tuneIncomingScreenShareConnection(mediaConn), 800);
  mediaConn.on("stream", (stream) => {
    if (screenShareState.remoteMediaConn !== mediaConn) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    tuneIncomingScreenShareConnection(mediaConn);
    screenShareState.remoteStream = stream;
    screenShareState.remoteAudioEnabled = Boolean(
      stream.getAudioTracks().length,
    );
    addSystemMessage(
      `${getPeerLabel(peerId, connections.get(peerId))} started streaming.`,
    );
    refreshCallUi();
    refreshCallStage();
  });
  mediaConn.on("close", () => {
    if (screenShareState.remoteMediaConn === mediaConn) {
      stopRemoteScreenShare({ message: "Screen stream ended." });
    }
  });
  mediaConn.on("error", () => {
    if (screenShareState.remoteMediaConn === mediaConn) {
      stopRemoteScreenShare({ message: "Screen stream ended." });
    }
  });
}

function handleRemoteScreenShareState(peerId, data) {
  if (callState.peerId !== peerId || callState.callId !== data.callId) {
    return;
  }

  if (data.active === false) {
    stopRemoteScreenShare();
    return;
  }
  screenShareState.remoteAudioEnabled = Boolean(data.audio);
  if (typeof data.viewerWatching === "boolean") {
    screenShareState.remoteViewerWatching = data.viewerWatching;
  }
  refreshCallStage();
}

function handleRemoteScreenWatchState(peerId, data) {
  if (callState.peerId !== peerId || callState.callId !== data.callId) {
    return;
  }

  screenShareState.remoteViewerWatching = data.watching !== false;
  screenShareState.localStream?.getVideoTracks().forEach((track) => {
    track.enabled = screenShareState.remoteViewerWatching;
  });
  screenShareState.localStream?.getAudioTracks().forEach((track) => {
    track.enabled = screenShareState.remoteViewerWatching;
  });
  refreshCallStage();
}

async function startVoiceCall() {
  if (!activePeerId || isCallBusy()) {
    return;
  }

  if (isNetworkOffline()) {
    setStatus("offline", "You're offline. Internet connection required.");
    return;
  }

  if (isPresenceOffline()) {
    setStatus("offline", "Offline");
    return;
  }

  const conn = connections.get(activePeerId);
  if (!conn?.open) {
    setStatus("offline", "The active peer is not ready yet.");
    return;
  }

  const callId = createCallId();
  setCallState("outgoing", { peerId: activePeerId, callId });
  scheduleOutgoingCallTimeout();
  sendProtocolMessage(conn, "call-request", { callId });
  addSystemMessage(`Calling ${getPeerLabel(activePeerId, conn)}...`);
}

function handleIncomingCallRequest(peerId, data) {
  if (
    isNetworkOffline() ||
    isPresenceOffline() ||
    !connections.has(peerId) ||
    typeof data.callId !== "string"
  ) {
    return;
  }

  const conn = connections.get(peerId);
  if (isCallBusy()) {
    sendProtocolMessage(conn, "call-declined", {
      callId: data.callId,
      reason: "busy",
    });
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

  if (isNetworkOffline() || isPresenceOffline()) {
    resetCallState();
    return;
  }

  const peerId = callState.peerId;
  const callId = callState.callId;
  const conn = connections.get(peerId);

  closeCallNotification(callId);
  setCallState("connecting", { peerId, callId });

  try {
    const { stream, audioAvailable, audioErrorMessage } =
      await createCallLocalStream();
    if (!isCurrentCallSession(peerId, callId, ["connecting"])) {
      stopCallStreamCandidate(stream);
      return;
    }
    setCallState("connecting", {
      peerId,
      callId,
      localStream: stream,
      localAudioAvailable: audioAvailable,
      localErrorMessage: audioErrorMessage,
      acceptedIncomingCallId: callId,
    });
    if (audioErrorMessage) {
      setStatus("pending", "Joined call without microphone.");
      addSystemMessage(`Joined call without microphone: ${audioErrorMessage}.`);
    }
    sendProtocolMessage(conn, "call-accepted", { callId });

    if (callState.incomingMediaConn?.metadata?.callId === callId) {
      callState.incomingMediaConn.answer(stream);
      tuneOutgoingAudio(callState.incomingMediaConn);
      attachMediaConnectionHandlers(
        callState.incomingMediaConn,
        peerId,
        callId,
      );
    }
  } catch (error) {
    if (!isCurrentCallSession(peerId, callId, ["connecting"])) {
      return;
    }
    closeCallNotification(callId);
    addSystemMessage(`Could not start call: ${error.message}`);
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
  addSystemMessage(
    `Call from ${getPeerLabel(callState.peerId, conn)} declined.`,
  );
  resetCallState();
}

async function handleCallAccepted(peerId, data) {
  const callId = data.callId;
  if (
    callState.status !== "outgoing" ||
    callState.peerId !== peerId ||
    callState.callId !== callId
  ) {
    return;
  }

  if (isPresenceOffline()) {
    resetCallState();
    return;
  }

  clearOutgoingCallTimeout();
  try {
    const { stream, audioAvailable, audioErrorMessage } =
      await createCallLocalStream();
    if (
      !isCurrentCallSession(peerId, callId, ["outgoing"]) ||
      !peer?.open
    ) {
      stopCallStreamCandidate(stream);
      return;
    }
    const mediaConn = peer.call(peerId, stream, {
      metadata: {
        ...createChatMetadata(),
        callId,
      },
      sdpTransform: improveVoiceSdp,
    });
    setCallState("connecting", {
      peerId,
      callId,
      localStream: stream,
      mediaConn,
      localAudioAvailable: audioAvailable,
      localErrorMessage: audioErrorMessage,
    });
    if (audioErrorMessage) {
      setStatus("pending", "Joined call without microphone.");
      addSystemMessage(`Joined call without microphone: ${audioErrorMessage}.`);
    }
    attachMediaConnectionHandlers(mediaConn, peerId, callId);
  } catch (error) {
    if (!isCurrentCallSession(peerId, callId, ["outgoing", "connecting"])) {
      return;
    }
    addSystemMessage(`Could not start call: ${error.message}`);
    sendProtocolMessage(connections.get(peerId), "call-ended", {
      callId,
    });
    resetCallState();
  }
}

function handleCallDeclined(peerId, data) {
  if (callState.peerId !== peerId || callState.callId !== data.callId) {
    return;
  }

  clearOutgoingCallTimeout();
  const label = getPeerLabel(peerId, connections.get(peerId));
  const message =
    data.reason === "busy"
      ? `${label} is busy.`
      : data.reason === "dnd"
        ? `${label} is in DND.`
        : `${label} declined the call.`;
  addSystemMessage(message);
  resetCallState();
}

function endVoiceCall({
  notifyPeer = true,
  message = "",
  silent = false,
} = {}) {
  clearOutgoingCallTimeout();
  const peerId = callState.peerId;
  const callId = callState.callId;
  const conn = peerId ? connections.get(peerId) : null;
  const wasJoined = callState.joined;

  closeCallNotification(callId);
  if (notifyPeer && conn?.open && callId) {
    sendProtocolMessage(conn, "call-ended", { callId });
  }

  resetCallState();
  if (wasJoined && !silent) {
    playCallLeaveSound();
  }
  if (message) {
    addSystemMessage(message);
  }
  syncPresenceStatusIndicator();
}

function handleRemoteCallEnded(peerId, data) {
  if (callState.peerId !== peerId || callState.callId !== data.callId) {
    return;
  }

  clearOutgoingCallTimeout();
  endVoiceCall({ notifyPeer: false, message: "Voice call ended." });
}

function rejectIncomingMediaCall(mediaConn) {
  mediaConn.answer();
  mediaConn.close();
}

function handleIncomingMediaCall(mediaConn) {
  if (isPresenceOffline()) {
    rejectIncomingMediaCall(mediaConn);
    return;
  }

  if (mediaConn.metadata?.kind === "screen") {
    handleIncomingScreenShare(mediaConn);
    return;
  }

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
  syncEnhancedSelect(select);
  return select.value;
}

function copyDeviceOptions(source, target) {
  target.replaceChildren(
    ...Array.from(source.options, (option) => option.cloneNode(true)),
  );
  syncEnhancedSelect(target);
}

async function refreshAudioDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) {
    microphoneSelect.replaceChildren(
      createDeviceOption("default", "Default microphone"),
    );
    cameraSelect.replaceChildren(
      createDeviceOption("default", "Default camera"),
    );
    speakerSelect.replaceChildren(
      createDeviceOption("default", "Default output"),
    );
    copyDeviceOptions(microphoneSelect, welcomeMicrophoneSelect);
    copyDeviceOptions(cameraSelect, welcomeCameraSelect);
    copyDeviceOptions(speakerSelect, welcomeSpeakerSelect);
    syncEnhancedSelects();
    return;
  }

  normalizeAudioConfig();
  const devices = await navigator.mediaDevices
    .enumerateDevices()
    .catch(() => []);
  const microphones = devices.filter((device) => device.kind === "audioinput");
  const cameras = devices.filter((device) => device.kind === "videoinput");
  const speakers = devices.filter((device) => device.kind === "audiooutput");

  microphoneSelect.replaceChildren(
    createDeviceOption("default", "Default microphone"),
  );
  for (const [index, device] of microphones.entries()) {
    if (device.deviceId === "default") {
      continue;
    }
    microphoneSelect.append(
      createDeviceOption(
        device.deviceId,
        device.label || `Microphone ${index + 1}`,
      ),
    );
  }

  cameraSelect.replaceChildren(createDeviceOption("default", "Default camera"));
  for (const [index, device] of cameras.entries()) {
    if (device.deviceId === "default") {
      continue;
    }
    cameraSelect.append(
      createDeviceOption(
        device.deviceId,
        device.label || `Camera ${index + 1}`,
      ),
    );
  }

  speakerSelect.replaceChildren(
    createDeviceOption("default", "Default output"),
  );
  for (const [index, device] of speakers.entries()) {
    if (device.deviceId === "default") {
      continue;
    }
    speakerSelect.append(
      createDeviceOption(
        device.deviceId,
        device.label || `Output ${index + 1}`,
      ),
    );
  }

  copyDeviceOptions(microphoneSelect, welcomeMicrophoneSelect);
  copyDeviceOptions(cameraSelect, welcomeCameraSelect);
  copyDeviceOptions(speakerSelect, welcomeSpeakerSelect);

  const nextInputDeviceId = setSelectValueOrDefault(
    microphoneSelect,
    appConfig.audio.inputDeviceId,
  );
  const nextCameraDeviceId = setSelectValueOrDefault(
    cameraSelect,
    appConfig.audio.cameraDeviceId,
  );
  const nextOutputDeviceId = setSelectValueOrDefault(
    speakerSelect,
    appConfig.audio.outputDeviceId,
  );
  setSelectValueOrDefault(welcomeMicrophoneSelect, nextInputDeviceId);
  setSelectValueOrDefault(welcomeCameraSelect, nextCameraDeviceId);
  setSelectValueOrDefault(welcomeSpeakerSelect, nextOutputDeviceId);
  if (
    nextInputDeviceId !== appConfig.audio.inputDeviceId ||
    nextCameraDeviceId !== appConfig.audio.cameraDeviceId ||
    nextOutputDeviceId !== appConfig.audio.outputDeviceId
  ) {
    appConfig.audio.inputDeviceId = nextInputDeviceId;
    appConfig.audio.cameraDeviceId = nextCameraDeviceId;
    appConfig.audio.outputDeviceId = nextOutputDeviceId;
    saveAppConfig();
  }
  syncEnhancedSelects();
}

function isSupportedDataChannel() {
  return Boolean(util.supports?.data && util.supports?.reliable);
}

function createChatMetadata() {
  return {
    app: appDisplayName,
    identityId: identity.id,
    previousIdentityIds: getKnownPreviousIdentityIds(
      identity.previousIds,
      identity.id,
    ),
    nickname: identity.nickname || "",
    avatar: normalizeAvatarConfig(identity.avatar),
    nameStyle: normalizeNameStyle(identity.nameStyle),
    protocol: PROTOCOL_VERSION,
    version: currentVersion,
  };
}

function rememberConnectionIdentity(peerId, metadata = {}) {
  const claimedIdentityId = metadata.identityId;
  if (
    !isValidAeroId(peerId) ||
    (claimedIdentityId && claimedIdentityId !== peerId) ||
    peerId === identity.id
  ) {
    return;
  }

  const identityId = peerId;
  const nickname = sanitizeNickname(metadata.nickname);
  const avatar = normalizeAvatarConfig(metadata.avatar);
  const nameStyle = normalizeNameStyle(metadata.nameStyle);
  migrateContactIdentity(metadata.previousIdentityIds, identityId, nickname);
  remoteIdentities.set(peerId, {
    identityId,
    nickname,
    avatar,
    nameStyle,
  });

  if (nickname) {
    rememberRemoteIdentity(identityId, nickname, avatar, nameStyle);
    return;
  }

  const existing = findContact(identityId);
  if (existing) {
    const updates = { avatar, nameStyle };
    if (!existing.customLabel && existing.label === identity.nickname) {
      updates.label = identityId;
      updates.pinned = existing.pinned;
    }
    upsertContact(identityId, updates);
  }
}

function getPeerLabel(peerId, conn) {
  const remoteIdentity = remoteIdentities.get(peerId);
  const identityId = remoteIdentity?.identityId || peerId;
  return (
    findContact(identityId)?.label || remoteIdentity?.nickname || identityId
  );
}

function getPeerIdentityId(peerId, conn) {
  return remoteIdentities.get(peerId)?.identityId || peerId;
}

function getPeerAvatar(peerId, identityId) {
  return (
    remoteIdentities.get(peerId)?.avatar ||
    findContact(identityId)?.avatar ||
    normalizeAvatarConfig()
  );
}

function getPeerNameStyle(peerId, identityId) {
  const contact = findContact(identityId);
  if (contact?.customLabel) {
    return null;
  }
  return remoteIdentities.get(peerId)?.nameStyle || contact?.nameStyle || null;
}

function openContactMenu(event, id) {
  event.preventDefault();
  event.stopPropagation?.();
  closeMessageMenu();
  closeAppMenu();
  closeParticipantMenu();
  closeStreamMenu();
  contextContactId = id;

  const contact = findContact(id);
  menuTrust.querySelector("span").textContent = contact?.trusted
    ? "Untrust"
    : "Trust";
  menuPin.querySelector("span").textContent = contact?.pinned ? "Unpin" : "Pin";
  menuNickname.querySelector("span").textContent = contact?.customLabel
    ? "Edit nickname"
    : "Add nickname";
  menuBlock.querySelector("span").textContent = contact?.blocked
    ? "Unblock"
    : "Block";

  contactMenu.style.left = `${Math.min(event.clientX, window.innerWidth - 164)}px`;
  contactMenu.style.top = `${Math.min(event.clientY, window.innerHeight - 132)}px`;
  contactMenu.classList.remove("hidden");
}

function openContactMenuFromButton(event, id) {
  event.preventDefault();
  event.stopPropagation();
  const rect = event.currentTarget.getBoundingClientRect();
  openContactMenu(
    {
      preventDefault() {},
      stopPropagation() {},
      clientX: rect.right,
      clientY: rect.bottom + 4,
    },
    id,
  );
}

function closeContactMenu() {
  contactMenu.classList.add("hidden");
  contextContactId = "";
}

function openAppMenu(event) {
  event.preventDefault();
  closeContactMenu();
  closeMessageMenu();
  closeParticipantMenu();
  closeStreamMenu();

  const rect = titlebarLogo.getBoundingClientRect();
  appMenu.style.left = `${Math.min(rect.left, window.innerWidth - 164)}px`;
  appMenu.style.top = `${Math.min(rect.bottom + 6, window.innerHeight - 44)}px`;
  appMenu.classList.remove("hidden");
  titlebarLogo.setAttribute("aria-expanded", "true");
}

function closeAppMenu() {
  appMenu.classList.add("hidden");
  titlebarLogo.setAttribute("aria-expanded", "false");
}

function openMessageMenu(event, messageItem) {
  event.preventDefault();
  closeContactMenu();
  closeAppMenu();
  closeParticipantMenu();
  closeStreamMenu();

  contextMessage = messageItem;

  messageMenu.style.left = `${Math.min(event.clientX, window.innerWidth - 164)}px`;
  messageMenu.style.top = `${Math.min(event.clientY, window.innerHeight - 80)}px`;
  messageMenu.classList.remove("hidden");
}

function closeMessageMenu() {
  messageMenu.classList.add("hidden");
  contextMessage = null;
}

function openParticipantMenu(event, target) {
  if (!target || callState.status === "idle") {
    return;
  }

  event.preventDefault();
  closeContactMenu();
  closeAppMenu();
  closeMessageMenu();
  closeStreamMenu();
  contextParticipantTarget = target;

  const peerId = callState.peerId;
  const peerVolume = getPeerPlaybackVolume(peerId);
  const showName =
    target === "local"
      ? isOwnVideoNameVisible()
      : isPeerVideoNameVisible(peerId);

  participantVolumeSlider.value = String(peerVolume);
  participantVolumeValue.textContent = `${peerVolume}%`;
  participantVolumeSlider.disabled = target === "local";
  participantToggleName.setAttribute("aria-checked", String(showName));
  participantToggleName.classList.toggle(
    "hidden",
    target === "remote"
      ? !callState.remoteCameraEnabled
      : !callState.localCameraEnabled,
  );
  participantMenu.style.left = `${Math.min(event.clientX, window.innerWidth - 202)}px`;
  participantMenu.style.top = `${Math.min(event.clientY, window.innerHeight - 120)}px`;
  participantMenu.classList.remove("hidden");
}

function closeParticipantMenu() {
  participantMenu.classList.add("hidden");
  contextParticipantTarget = null;
}

function closeStreamMenu() {
  streamMenu.classList.add("hidden");
  contextStreamTarget = "";
}

function openStreamMenu(event, target) {
  event.preventDefault();
  if (callState.status === "idle") {
    return;
  }

  closeContactMenu();
  closeAppMenu();
  closeMessageMenu();
  closeParticipantMenu();
  contextStreamTarget = target;
  const isLocal = target === "local";

  streamMenuQuality.classList.toggle("hidden", !isLocal);
  streamMenuSource.classList.toggle("hidden", !isLocal);
  streamMenuAudio.classList.toggle("hidden", !isLocal);
  streamMenuStop.classList.toggle("hidden", !isLocal);
  streamMenuWatch.classList.toggle("hidden", isLocal);
  streamMenuFullscreen.classList.toggle("hidden", !hasStreamForTarget(target));
  streamMenuAudio.setAttribute(
    "aria-checked",
    String(screenShareState.audioEnabled),
  );
  const fullscreenIcon = streamMenuFullscreen.querySelector("i");
  const fullscreenLabel = streamMenuFullscreen.querySelector("span");
  const fullscreenActive = streamFullscreenTarget === target;
  if (fullscreenIcon) {
    fullscreenIcon.className = fullscreenActive
      ? "fa-solid fa-compress"
      : "fa-solid fa-expand";
  }
  if (fullscreenLabel) {
    fullscreenLabel.textContent = fullscreenActive
      ? "Shrink stream"
      : "Expand stream";
  }
  if (!isLocal) {
    const hidden =
      !screenShareState.viewerWatching || screenShareState.hiddenByViewer;
    const icon = streamMenuWatch.querySelector("i");
    const label = streamMenuWatch.querySelector("span");
    if (icon) {
      icon.className = hidden ? "fa-solid fa-eye" : "fa-solid fa-eye-slash";
    }
    if (label) {
      label.textContent = hidden ? "Show Stream" : "Close Stream";
    }
  }
  streamMenu.style.left = `${Math.min(event.clientX, window.innerWidth - 212)}px`;
  streamMenu.style.top = `${Math.min(event.clientY, window.innerHeight - 202)}px`;
  streamMenu.classList.remove("hidden");
}

function getStreamSourceType(source) {
  return String(source?.id || "").startsWith("screen:") ? "screens" : "windows";
}

function formatStreamSourceName(source) {
  const name = String(source?.name || "").trim();
  if (getStreamSourceType(source) === "screens") {
    const screenMatch = name.match(/^Bildschirm(?:\s+(\d+))?$/i);
    if (screenMatch) {
      return `Screen${screenMatch[1] ? ` ${screenMatch[1]}` : ""}`;
    }
  }

  return (
    name ||
    (getStreamSourceType(source) === "screens" ? "Screen" : "Application")
  );
}

function setActiveStreamSourceTab(tab) {
  activeStreamSourceTab = tab === "windows" ? "windows" : "screens";
  streamTabScreens?.classList.toggle(
    "active",
    activeStreamSourceTab === "screens",
  );
  streamTabWindows?.classList.toggle(
    "active",
    activeStreamSourceTab === "windows",
  );
  streamTabScreens?.setAttribute(
    "aria-selected",
    String(activeStreamSourceTab === "screens"),
  );
  streamTabWindows?.setAttribute(
    "aria-selected",
    String(activeStreamSourceTab === "windows"),
  );
}

function createStreamSourceEmptyState(tab) {
  const empty = document.createElement("div");
  empty.className = "screen-source-empty";
  const icon = document.createElement("i");
  icon.className =
    tab === "screens" ? "fa-solid fa-display" : "fa-solid fa-window-maximize";
  icon.setAttribute("aria-hidden", "true");
  const label = document.createElement("strong");
  label.textContent =
    tab === "screens" ? "No screens found" : "No app windows found";
  empty.append(icon, label);
  return empty;
}

function renderScreenSources(sources = availableScreenSources) {
  availableScreenSources = Array.isArray(sources) ? sources : [];
  const visibleSources = availableScreenSources.filter(
    (source) => getStreamSourceType(source) === activeStreamSourceTab,
  );
  if (
    !selectedScreenSource ||
    getStreamSourceType(selectedScreenSource) !== activeStreamSourceTab
  ) {
    selectedScreenSource = visibleSources[0] || null;
  }
  screenSourceList.replaceChildren();
  for (const source of visibleSources) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "screen-source-button";
    button.dataset.sourceId = source.id;
    button.setAttribute(
      "aria-pressed",
      String(selectedScreenSource?.id === source.id),
    );

    const badge = document.createElement("span");
    badge.className = "screen-source-badge";
    const badgeIcon = document.createElement("i");
    badgeIcon.className =
      getStreamSourceType(source) === "screens"
        ? "fa-solid fa-display"
        : "fa-solid fa-window-maximize";
    badgeIcon.setAttribute("aria-hidden", "true");
    badge.append(badgeIcon);
    const image = document.createElement("img");
    image.alt = "";
    image.src = source.thumbnail || "";
    const label = document.createElement("span");
    label.className = "screen-source-name";
    label.textContent = formatStreamSourceName(source);
    button.append(image, badge, label);
    button.addEventListener("click", () => {
      selectedScreenSource = source;
      for (const item of screenSourceList.querySelectorAll(
        ".screen-source-button",
      )) {
        item.setAttribute("aria-pressed", "false");
      }
      button.setAttribute("aria-pressed", "true");
      streamStartButton.disabled = false;
    });
    screenSourceList.append(button);
  }
  streamStartButton.disabled = !selectedScreenSource;
  if (!visibleSources.length) {
    screenSourceList.append(
      createStreamSourceEmptyState(activeStreamSourceTab),
    );
  }
}

async function openStreamSetup({ reuseCurrent = false } = {}) {
  if (callState.status === "idle" || !callState.peerId) {
    return;
  }

  closeStreamMenu();
  setActiveStreamSourceTab("screens");
  streamQualitySelect.value = normalizeScreenQuality(screenShareState.quality);
  streamFpsSelect.value = String(normalizeScreenFps(screenShareState.fps));
  syncEnhancedSelect(streamQualitySelect);
  syncEnhancedSelect(streamFpsSelect);
  streamAudioToggle.checked = Boolean(screenShareState.audioEnabled);
  streamModal.classList.remove("hidden");
  screenSourceList.replaceChildren();
  const loading = document.createElement("div");
  loading.className = "screen-source-empty";
  const loadingIcon = document.createElement("i");
  loadingIcon.className = "fa-solid fa-spinner";
  loadingIcon.setAttribute("aria-hidden", "true");
  const loadingText = document.createElement("strong");
  loadingText.textContent = "Loading sources...";
  loading.append(loadingIcon, loadingText);
  screenSourceList.append(loading);
  streamStartButton.disabled = true;

  try {
    const sources = (await platformApi.getScreenSources()) || [];
    if (reuseCurrent && screenShareState.sourceId) {
      const current = sources.find(
        (source) => source.id === screenShareState.sourceId,
      );
      if (current) {
        setActiveStreamSourceTab(getStreamSourceType(current));
        selectedScreenSource = current;
      }
    }
    renderScreenSources(sources);
  } catch {
    renderScreenSources([]);
  }
}

function closeStreamSetup() {
  streamModal.classList.add("hidden");
  selectedScreenSource = null;
  availableScreenSources = [];
}

function deleteMessageLocally(peerId, messageId) {
  const history = ensureChatHistory(peerId);
  const index = history.findIndex((msg) => msg.id === messageId);
  if (index !== -1) {
    const objectUrl = history[index].voice?.objectUrl;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
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

  return (
    conn.label === CHAT_LABEL ||
    conn.metadata?.app === appDisplayName ||
    !conn.metadata
  );
}

function normalizeMessage(data) {
  if (!data || data.type !== "chat-message" || typeof data.text !== "string") {
    return null;
  }

  return {
    id: typeof data.id === "string" ? data.id : null,
    text: data.text.slice(0, MAX_MESSAGE_LENGTH),
    time: typeof data.time === "string" ? data.time : formatTime(),
  };
}

function sendProtocolMessage(conn, type, extra = {}) {
  if (isNetworkOffline() || !conn?.open) {
    return false;
  }

  try {
    conn.send({
      type,
      protocol: PROTOCOL_VERSION,
      identityId: identity.id,
      nickname: identity.nickname || "",
      avatar: normalizeAvatarConfig(identity.avatar),
      nameStyle: normalizeNameStyle(identity.nameStyle),
      time: formatTime(),
      ...extra,
    });
    return true;
  } catch {
    return false;
  }
}

function writeDevLog(message) {
  if (location.protocol === "http:") {
    window.aeroChat?.log(`[Aero] ${message}`);
  }
}

function areReadReceiptsVisibleForPeer(peerId) {
  return Boolean(
    appConfig.appSettings?.readReceipts &&
    remoteReadReceiptsEnabled.get(peerId) !== false,
  );
}

function sendReceiptSettings(conn) {
  return sendProtocolMessage(conn, "receipt-settings", {
    readReceipts: Boolean(appConfig.appSettings?.readReceipts),
  });
}

function broadcastReceiptSettings() {
  for (const conn of connections.values()) {
    sendReceiptSettings(conn);
  }
}

function stopConnectionHeartbeat(peerId) {
  const heartbeat = connectionHeartbeats.get(peerId);
  if (!heartbeat) {
    return;
  }

  clearInterval(heartbeat.timer);
  connectionHeartbeats.delete(peerId);
}

function handleConnectionHeartbeatTimeout(peerId, conn) {
  if (connections.get(peerId) !== conn) {
    stopConnectionHeartbeat(peerId);
    return;
  }

  const label = getPeerLabel(peerId, conn);
  stopConnectionHeartbeat(peerId);
  conn.close();
  removePeer(peerId);
  setStatus(
    connections.size > 0 ? "online" : "pending",
    connections.size > 0 ? "Peer connected" : "Ready to connect",
  );
  addSystemMessage(`${label} is offline. Connection closed.`);
  refreshPeers();
}

function startConnectionHeartbeat(peerId, conn) {
  stopConnectionHeartbeat(peerId);

  const heartbeat = {
    lastSeenAt: Date.now(),
    timer: setInterval(() => {
      if (connections.get(peerId) !== conn || !conn.open) {
        stopConnectionHeartbeat(peerId);
        return;
      }

      if (Date.now() - heartbeat.lastSeenAt > CONNECTION_HEARTBEAT_TIMEOUT_MS) {
        handleConnectionHeartbeatTimeout(peerId, conn);
        return;
      }

      sendProtocolMessage(conn, "connection-ping");
    }, CONNECTION_HEARTBEAT_INTERVAL_MS),
  };

  connectionHeartbeats.set(peerId, heartbeat);
  sendProtocolMessage(conn, "connection-ping");
}

function markConnectionHeartbeat(peerId) {
  const heartbeat = connectionHeartbeats.get(peerId);
  if (heartbeat) {
    heartbeat.lastSeenAt = Date.now();
  }
}

function removePeer(peerId, { silent = false } = {}) {
  clearConnectTimeout(peerId);
  stopConnectionHeartbeat(peerId);
  clearOutgoingMessageQueue(peerId);
  incomingMessageWindows.delete(peerId);
  typingStates.delete(peerId);
  const typingTimer = typingTimers.get(peerId);
  if (typingTimer) {
    clearTimeout(typingTimer);
    typingTimers.delete(peerId);
  }
  const localTypingTimer = localTypingTimers.get(peerId);
  if (localTypingTimer) {
    clearTimeout(localTypingTimer);
    localTypingTimers.delete(peerId);
  }
  lastTypingSentAt.delete(peerId);
  voiceRecordingStates.delete(peerId);
  const voiceRecordingTimeout = voiceRecordingTimers.get(peerId);
  if (voiceRecordingTimeout) clearTimeout(voiceRecordingTimeout);
  voiceRecordingTimers.delete(peerId);
  for (const [key, transfer] of incomingVoiceTransfers) {
    if (key.startsWith(`${peerId}:`)) {
      incomingVoiceTransfers.delete(key);
      const item = findVoiceMessage(peerId, transfer.voice.id);
      if (item?.voice?.downloadState === "requested") {
        item.voice.downloadState = "failed";
        item.voice.transferStatus = "Connection lost - retry after reconnecting";
      }
    }
  }
  remoteReadReceiptsEnabled.delete(peerId);
  remoteIdentities.delete(peerId);
  if (callState.peerId === peerId) {
    endVoiceCall({
      notifyPeer: false,
      message: silent ? "" : "Voice call ended.",
      silent,
    });
  }

  connections.delete(peerId);
  pendingConnections.delete(peerId);
  if (activePeerId === peerId) {
    activePeerId = connections.keys().next().value ?? null;
    renderChatHistory();
  }
  updateTypingIndicator();
}

function refreshPeers() {
  peerList.replaceChildren();
  const query = getContactSearchQuery();

  if (connections.size === 0 && pendingConnections.size === 0) {
    if (contacts.length === 0 && !query) {
      const empty = document.createElement("span");
      empty.className = "empty-peer";
      empty.textContent = "No contacts yet";
      peerList.append(empty);
    }
    chatTitle.textContent = "Ready to connect";
    messageInput.disabled = true;
    sendButton.disabled = true;
    updateVoiceRecordUi();
    callChat.disabled = true;
    disconnectChat.disabled = true;
    renderChatHistory();
  }

  const visibleContactIds = new Set([
    ...connections.keys(),
    ...pendingConnections.keys(),
  ]);

  const favoriteContacts = getVisibleContacts()
    .filter((contact) => !visibleContactIds.has(contact.id))
    .filter((contact) => contactMatchesSearch(contact.id));
  if (favoriteContacts.length > 0) {
    appendPeerSectionLabel("Favorites");
  }

  for (const contact of favoriteContacts) {
    const row = document.createElement("div");
    row.className = "contact-item";

    const name = document.createElement("button");
    name.type = "button";
    name.className = "contact-name";
    name.append(createAvatar(contact.label, contact.id, contact.avatar));
    name.append(createContactBadges(contact));
    
    name.append(
      createContactIdentityLabel(
        contact.label,
        contact.customLabel ? null : contact.nameStyle,
      ),
    );
    name.addEventListener("click", () => {
      connectToPeer(contact.id);
    });
    name.addEventListener("contextmenu", (event) => {
      openContactMenu(event, contact.id);
    });

    const menu = document.createElement("button");
    menu.type = "button";
    menu.className = "contact-menu-button";
    menu.title = "Contact actions";
    menu.setAttribute("aria-label", `Open actions for ${contact.label}`);
    menu.append(renderIcon("fa-solid fa-ellipsis"));
    menu.addEventListener("click", (event) => {
      openContactMenuFromButton(event, contact.id);
    });

    row.addEventListener("contextmenu", (event) => {
      openContactMenu(event, contact.id);
    });

    row.append(name, menu);
    peerList.append(row);
  }

  const pendingEntries = [...pendingConnections].filter(([peerId, entry]) =>
    contactMatchesSearch(peerId, entry.conn),
  );
  if (pendingEntries.length > 0) {
    appendPeerSectionLabel("Requests");
  }

  for (const [peerId, entry] of pendingEntries) {
    const peerLabel = getPeerLabel(peerId, entry.conn);
    if (entry.direction === "incoming") {
      const row = document.createElement("div");
      row.className = "request-item";

      const name = document.createElement("span");
      const identityId = getPeerIdentityId(peerId, entry.conn);
      const contact = findContact(identityId);
      name.append(
        createAvatar(peerLabel, identityId, getPeerAvatar(peerId, identityId)),
      );
        name.append(
          createContactBadges({
            pinned: Boolean(contact?.pinned),
            trusted: isTrusted(identityId),
            waiting: true,
          }),
        );
      name.append(
        createContactIdentityLabel(
          peerLabel,
          getPeerNameStyle(peerId, identityId),
        ),
      );

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
    waiting.append(
      createAvatar(peerLabel, identityId, getPeerAvatar(peerId, identityId)),
    );
      waiting.append(
        createContactBadges({
          pinned: Boolean(contact?.pinned),
          trusted: isTrusted(identityId),
          waiting: true,
        }),
      );
    const label = document.createElement("span");
    label.className = "contact-label";
    label.textContent = peerLabel;
    applyNameAppearance(label, getPeerNameStyle(peerId, identityId));
    waiting.append(label);
    waiting.setAttribute("aria-disabled", "true");
    waiting.addEventListener("contextmenu", (event) => {
      openContactMenu(event, getPeerIdentityId(peerId, entry.conn));
    });
    peerList.append(waiting);
  }

  const connectionEntries = [...connections].filter(([peerId, conn]) =>
    contactMatchesSearch(peerId, conn),
  );

  for (const [peerId, conn] of connectionEntries) {
    const peerLabel = getPeerLabel(peerId, conn);
    const button = document.createElement("button");
      button.type = "button";
      button.className =
        peerId === activePeerId ? "peer-chip active" : "peer-chip";
      const identityId = getPeerIdentityId(peerId, conn);
      const contact = findContact(identityId);
      button.append(
        createAvatar(peerLabel, identityId, getPeerAvatar(peerId, identityId)),
      );
      button.append(
        createContactBadges({
        pinned: Boolean(contact?.pinned),
        trusted: isTrusted(identityId),
        online: conn.open,
      }),
    );
    button.append(
      createContactIdentityLabel(
        conn.open ? peerLabel : `${peerLabel} ...`,
        getPeerNameStyle(peerId, identityId),
      ),
    );
    const unread = unreadCounts.get(peerId) || 0;
    button.setAttribute(
      "aria-label",
      unread > 0
        ? `${peerLabel}, ${unread} unread message${unread === 1 ? "" : "s"}`
        : peerLabel,
    );
    button.setAttribute(
      "aria-current",
      peerId === activePeerId ? "true" : "false",
    );
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
      setMobileTab("chat");
      messageInput.focus();
    });
    button.addEventListener("contextmenu", (event) => {
      openContactMenu(event, getPeerIdentityId(peerId, conn));
    });
    peerList.append(button);
  }

  if (peerList.childElementCount === 0) {
    const empty = document.createElement("span");
    empty.className = "empty-peer";
    empty.textContent = query ? "No matching contacts" : "No contacts yet";
    peerList.append(empty);
  }

  const activeConn = activePeerId ? connections.get(activePeerId) : null;
  const canChat = Boolean(activeConn?.open && !isNetworkOffline());
  chatTitle.textContent = activePeerId
    ? getPeerLabel(activePeerId, activeConn)
    : "No active chat";
  applyNameAppearance(
    chatTitle,
    activePeerId
      ? getPeerNameStyle(activePeerId, getPeerIdentityId(activePeerId, activeConn))
      : null,
  );

  messageInput.disabled = !canChat;
  sendButton.disabled = !canChat;
  updateVoiceRecordUi();
  disconnectChat.disabled = !canChat;
  messageForm.classList.toggle("unavailable", !canChat);
  updateConnectButton();
  refreshCallUi();
  syncChatActionAvailability();
  refreshCallStage();
  updateEmptyChatState();
}

function acceptConnection(peerId) {
  const entry = pendingConnections.get(peerId);
  if (!entry) {
    return;
  }

  const peerLabel = getPeerLabel(peerId, entry.conn);
  clearConnectTimeout(peerId);

  pendingConnections.delete(peerId);
  connections.set(peerId, entry.conn);
  activePeerId = peerId;

  if (entry.conn.open) {
    sendReceiptSettings(entry.conn);
    sendProtocolMessage(entry.conn, "connection-accepted");
    startConnectionHeartbeat(peerId, entry.conn);
    pinContact(
      getPeerIdentityId(peerId, entry.conn),
      getPeerLabel(peerId, entry.conn),
    );
    setStatus("online", `Connected to ${peerLabel}`);
    writeDevLog("Connection accepted.");
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
  clearConnectTimeout(peerId);

  sendProtocolMessage(entry.conn, "connection-declined");
  entry.conn.close();
  pendingConnections.delete(peerId);
  setStatus(
    connections.size > 0 ? "online" : "pending",
    connections.size > 0 ? "Peer connected" : "Ready to connect",
  );
  addSystemMessage(`Connection request from ${peerLabel} declined.`);
  refreshPeers();
}

function promoteOutgoingConnection(peerId) {
  const entry = pendingConnections.get(peerId);
  if (!entry) {
    return;
  }

  const peerLabel = getPeerLabel(peerId, entry.conn);
  clearConnectTimeout(peerId);

  pendingConnections.delete(peerId);
  connections.set(peerId, entry.conn);
  activePeerId = peerId;
  pinContact(getPeerIdentityId(peerId, entry.conn), peerLabel);
  sendReceiptSettings(entry.conn);
  startConnectionHeartbeat(peerId, entry.conn);
  setStatus("online", `Connected to ${peerLabel}`);
  writeDevLog("Connection established.");
  renderChatHistory();
  addSystemMessage(`${peerLabel} accepted your request.`);
  playConnectedSound();
  messageInput.focus();
  refreshPeers();
}

function attachConnectionHandlers(conn, peerId, direction) {
  const peerLabel = () => getPeerLabel(peerId, conn);

  conn.on("open", () => {
    hideConnectRetry();
    platformApi.vibrate("heavy");
    sendReceiptSettings(conn);
    const pending = pendingConnections.get(peerId);
    if (pending?.direction === "outgoing") {
      sendProtocolMessage(conn, "connection-request");
      setStatus("pending", `Waiting for ${peerLabel()} to accept...`);
      refreshPeers();
      return;
    }

    if (pending?.acceptOnOpen) {
      hideConnectRetry();
      pendingConnections.delete(peerId);
      connections.set(peerId, conn);
      activePeerId = peerId;
      sendReceiptSettings(conn);
      sendProtocolMessage(conn, "connection-accepted");
      startConnectionHeartbeat(peerId, conn);
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
      hideConnectRetry();
      startConnectionHeartbeat(peerId, conn);
      setStatus("online", `Connected to ${peerLabel()}`);
      refreshPeers();
    }
  });

  conn.on("data", (data) => {
    if (isPresenceOffline()) {
      conn.close();
      return;
    }

    rememberConnectionIdentity(peerId, data);
    markConnectionHeartbeat(peerId);

    if (data?.type === "profile-update") {
      refreshPeers();
      refreshCallStage();
      return;
    }

    if (data?.type === "connection-ping") {
      sendProtocolMessage(conn, "connection-pong");
      return;
    }

    if (data?.type === "connection-pong") {
      return;
    }

    if (data?.type === "connection-request") {
      const pending = pendingConnections.get(peerId);
      if (pending?.direction === "incoming") {
        pending.receivedRequest = true;
        if (isTrusted(getPeerIdentityId(peerId, conn))) {
          // Wait for the sender's explicit request packet. Accepting directly
          // from PeerJS' connection event can race the remote open handler.
          acceptConnection(peerId);
          return;
        }

        setStatus("pending", `Connection request from ${peerLabel()}`);
        addSystemMessage(`${peerLabel()} wants to chat. Accept the request to start.`);
      }
      refreshPeers();
      return;
    }

    if (data?.type === "connection-accepted") {
      promoteOutgoingConnection(peerId);
      return;
    }

    if (data?.type === "connection-declined") {
      clearConnectTimeout(peerId);
      pendingConnections.delete(peerId);
      conn.close();
      showConnectRetry(peerId);
      setStatus(
        "offline",
        `${peerLabel()} declined your request. Use Retry to try again.`,
      );
      addSystemMessage(`${peerLabel()} declined your connection request.`);
      refreshPeers();
      return;
    }

    if (data?.type === "connection-closed") {
      conn.close();
      removePeer(peerId);
      setStatus(
        connections.size > 0 ? "online" : "pending",
        connections.size > 0 ? "Peer connected" : "Ready to connect",
      );
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

    if (data?.type === "call-status") {
      handleRemoteCallStatus(peerId, data);
      return;
    }

    if (data?.type === "camera-state") {
      handleRemoteCameraState(peerId, data);
      return;
    }

    if (data?.type === "screen-share-state") {
      handleRemoteScreenShareState(peerId, data);
      return;
    }

    if (data?.type === "screen-watch-state") {
      handleRemoteScreenWatchState(peerId, data);
      return;
    }

    if (data?.type === "voice-recording") {
      setRemoteVoiceRecording(peerId, Boolean(data.recording));
      return;
    }

    if (data?.type === "typing") {
      setRemoteTyping(peerId, Boolean(data.typing));
      return;
    }

    if (data?.type === "receipt-settings") {
      remoteReadReceiptsEnabled.set(peerId, data.readReceipts !== false);
      if (activePeerId === peerId) {
        renderChatHistory();
      }
      return;
    }

    if (
      data?.type === "message-delivered" &&
      typeof data.messageId === "string"
    ) {
      setMessageDeliveryState(peerId, data.messageId, "delivered");
      return;
    }

    if (data?.type === "message-read" && typeof data.messageId === "string") {
      if (appConfig.appSettings?.readReceipts) {
        setMessageDeliveryState(peerId, data.messageId, "read");
      }
      return;
    }

    if (data?.type === "delete-message" && typeof data.messageId === "string") {
      const item = ensureChatHistory(peerId).find(
        (entry) => entry.id === data.messageId,
      );
      if (item?.sender === "them") {
        deleteMessageLocally(peerId, data.messageId);
      }
      return;
    }

    if (data?.type === "voice-offer") {
      handleVoiceOffer(peerId, conn, data);
      return;
    }

    if (data?.type === "voice-request") {
      handleVoiceRequest(peerId, conn, data);
      return;
    }

    if (data?.type === "voice-transfer-start") {
      handleVoiceTransferStart(peerId, conn, data);
      return;
    }

    if (data?.type === "voice-transfer-chunk") {
      handleVoiceTransferChunk(peerId, data);
      return;
    }

    if (data?.type === "voice-transfer-complete") {
      handleVoiceTransferComplete(peerId, data);
      return;
    }

    if (data?.type === "voice-transfer-failed") {
      failVoiceDownload(peerId, String(data.voiceId || ""), "Sender unavailable - retry");
      return;
    }

    const message = normalizeMessage(data);
    if (!message || !connections.has(peerId)) {
      return;
    }
    if (!shouldAcceptIncomingMessage(peerId)) {
      return;
    }

    addChatMessage({
      id: message.id,
      text: message.text,
      sender: "them",
      peerId,
      time: message.time,
    });
    if (message.id && appConfig.appSettings?.readReceipts) {
      sendProtocolMessage(conn, "message-delivered", { messageId: message.id });
    }
    if (
      message.id &&
      activePeerId === peerId &&
      appConfig.appSettings?.readReceipts &&
      isAppFocused()
    ) {
      const item = ensureChatHistory(peerId).find(
        (entry) => entry.id === message.id,
      );
      if (
        item &&
        sendProtocolMessage(conn, "message-read", { messageId: message.id })
      ) {
        item.readReceiptSent = true;
      }
    }
    notifyIncomingMessage(peerId, message.text);
  });

  conn.on("close", () => {
    const wasKnown =
      connections.get(peerId) === conn ||
      pendingConnections.get(peerId)?.conn === conn;
    if (!wasKnown) {
      return;
    }

    removePeer(peerId, {
      silent: suppressPeerCloseMessages || isPresenceOffline(),
    });
    writeDevLog("Connection closed.");
    if (!suppressPeerCloseMessages && !isPresenceOffline()) {
      addSystemMessage(`${peerLabel()} closed the connection.`);
      setStatus(
        connections.size > 0 ? "online" : "pending",
        connections.size > 0 ? "Peer connected" : "Ready to connect",
      );
    }
    refreshPeers();
  });

  conn.on("error", (error) => {
    if (direction === "outgoing" && isPeerUnreachableError(error)) {
      showUnreachablePeerFeedback(peerId, {
        label: peerLabel(),
        reason: `${peerLabel()} could not be reached. They may be offline or not connected to the signaling server.`,
      });
      return;
    }

    const message = error?.message || "The connection failed.";
    setStatus(
      "offline",
      `Could not connect to ${peerLabel()}. Use Retry to try again.`,
    );
    showConnectRetry(peerId);
    addSystemMessage(`Connection with ${peerLabel()} failed: ${message}`);
  });
}

function registerConnection(conn, options = {}) {
  const peerId = conn.peer;
  const direction = options.incoming ? "incoming" : "outgoing";
  if (isNetworkOffline() || isPresenceOffline()) {
    conn.close();
    return;
  }
  if (!isKnownChatConnection(conn)) {
    addSystemMessage(`Rejected unsupported connection from ${peerId}.`);
    conn.close();
    return;
  }
  if (direction === "incoming") {
    rememberConnectionIdentity(peerId, conn.metadata);
  }
  const peerIdentityId = getPeerIdentityId(peerId, conn);

  if (direction === "incoming" && isBlocked(peerIdentityId)) {
    conn.close();
    setStatus(
      connections.size > 0 ? "online" : "pending",
      connections.size > 0 ? "Peer connected" : "Ready to connect",
    );
    return;
  }

  if (connections.has(peerId)) {
    connections.get(peerId).close();
  }
  if (pendingConnections.has(peerId)) {
    pendingConnections.get(peerId).conn.close();
  }

  pendingConnections.set(peerId, { conn, direction, receivedRequest: false });
  attachConnectionHandlers(conn, peerId, direction);
  if (direction === "outgoing") {
    startConnectTimeout(peerId, conn);
  }

  if (direction === "incoming") {
    // The trusted auto-accept happens after the remote side has sent its
    // connection-request packet. This removes a timing race on fast/mobile
    // links where the previous eager accept could be missed.
    setStatus("pending", `Connecting with ${getPeerLabel(peerId, conn)}...`);
  } else {
    setStatus("pending", `Sending request to ${getPeerLabel(peerId, conn)}...`);
  }

  refreshPeers();
}

function connectToPeer(remoteId) {
  remoteId = normalizeAeroId(remoteId);
  hideConnectRetry();

  if (isNetworkOffline()) {
    setStatus("offline", "You're offline. Internet connection required.");
    return;
  }

  if (!peer?.open) {
    setStatus("offline", "Your peer is not ready yet.");
    return;
  }

  if (isPresenceOffline()) {
    setStatus("offline", "You are offline. Switch to Online to connect.");
    return;
  }

  if (!remoteId || remoteId === myPeerId) {
    setStatus("offline", "Please enter a different peer ID.");
    return;
  }

  if (connections.has(remoteId)) {
    activePeerId = remoteId;
    renderChatHistory();
    refreshPeers();
    setMobileTab("chat");
    setStatus(
      "online",
      `Already connected to ${getPeerLabel(remoteId, connections.get(remoteId))}.`,
    );
    return;
  }

  if (pendingConnections.has(remoteId)) {
    setStatus(
      "pending",
      `Already trying to connect to ${getPeerLabel(remoteId, pendingConnections.get(remoteId)?.conn)}...`,
    );
    return;
  }

  const conn = peer.connect(remoteId, {
    label: CHAT_LABEL,
    metadata: createChatMetadata(),
    reliable: true,
    serialization: "binary",
  });
  writeDevLog("Connection request started.");
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

  syncPresenceStatusIndicator();
}

function renderContactNicknameList() {
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
      addSystemMessage(
        `${findContact(contact.id)?.label || contact.id} nickname saved.`,
      );
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

function selectSettingsPage(page = "appearance") {
  const selectedPage = settingsPages.some(
    (section) => section.dataset.settingsPage === page,
  )
    ? page
    : "appearance";
  for (const item of settingsNavItems) {
    const active = item.dataset.settingsNav === selectedPage;
    item.classList.toggle("active", active);
    item.setAttribute("aria-current", active ? "page" : "false");
  }
  const pageChanged = activeSettingsPage !== selectedPage;
  let selectedSection = null;
  for (const section of settingsPages) {
    const active = section.dataset.settingsPage === selectedPage;
    section.classList.toggle(
      "hidden",
      !active,
    );
    if (active) {
      selectedSection = section;
    }
  }
  if (
    pageChanged &&
    selectedSection &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    // Restart the small entrance animation whenever a different category opens.
    selectedSection.classList.remove("settings-page-enter");
    void selectedSection.offsetWidth;
    selectedSection.classList.add("settings-page-enter");
  }
  activeSettingsPage = selectedPage;
  settingsContent?.scrollTo({ top: 0, behavior: "auto" });
}

function openSettings(focusContactId = "") {
  refreshAudioDevices();
  renderAppSettings();
  void refreshCustomThemes();
  renderAudioSettings();
  renderContactNicknameList(focusContactId);
  renderBlockedList();
  selectSettingsPage(focusContactId ? "contacts" : "appearance");
  settingsModal.classList.remove("hidden");
  if (focusContactId) {
    requestAnimationFrame(() => {
      const input = contactNicknameList.querySelector(
        `[data-contact-id="${focusContactId}"]`,
      );
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
    secure: true,
    config: peerConnectionConfig,
  });

  nextPeer.on("open", (id) => {
    intentionalPeerDisconnect = false;
    if (isNetworkOffline()) {
      intentionalPeerDisconnect = true;
      nextPeer.disconnect();
      return;
    }
    myPeerId = id;
    ownId.textContent = identity.id;
    setStatus("pending", "Aero ID ready. Share it with your chat partner.");
    updateConnectButton();
    if (isPresenceOffline()) {
      setPresenceStatus("offline", { force: true });
      return;
    }
    syncPresenceStatusIndicator();
  });

  nextPeer.on("connection", (conn) => {
    registerConnection(conn, { incoming: true });
  });

  nextPeer.on("call", (mediaConn) => {
    handleIncomingMediaCall(mediaConn);
  });

  nextPeer.on("disconnected", () => {
    if (isNetworkOffline()) {
      return;
    }
    if (intentionalPeerDisconnect) {
      intentionalPeerDisconnect = false;
      syncPresenceStatusIndicator();
      return;
    }

    setStatus("offline", "Signaling disconnected. Reconnecting...");
    if (!isPresenceOffline()) {
      nextPeer.reconnect();
    }
  });

  nextPeer.on("error", (error) => {
    if (isNetworkOffline()) {
      return;
    }
    if (error.type === "unavailable-id") {
      setStatus(
        "offline",
        "This Aero ID is already online in another app window.",
      );
      addSystemMessage(
        "Close the other running instance or reset app data to create a new Aero ID.",
      );
      return;
    }

    const outgoingPeerId = getOutgoingPendingPeerId(error);
    if (isPeerUnreachableError(error) && outgoingPeerId) {
      showUnreachablePeerFeedback(outgoingPeerId, {
        reason: "That contact is offline or cannot be reached right now.",
      });
      return;
    }

    const message = error.message || "The peer connection failed.";
    setStatus(
      "offline",
      "Connection failed. Check your internet connection and try again.",
    );
    addSystemMessage(`Connection error: ${message}`);
  });

  nextPeer.on("close", () => {
    if (isNetworkOffline()) {
      return;
    }
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

ownIdPrivacyToggle.addEventListener("click", () => {
  saveAppSettings({ hideOwnId: !appConfig.appSettings.hideOwnId });
});

connectForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (
    isActionOnCooldown(
      "connect",
      CONNECT_ACTION_COOLDOWN_MS,
      "Please wait before trying another connection.",
    )
  ) {
    return;
  }

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

retryConnectButton?.addEventListener("click", () => {
  if (
    isActionOnCooldown(
      "connect",
      CONNECT_ACTION_COOLDOWN_MS,
      "Please wait before retrying.",
    )
  ) {
    return;
  }

  const remoteId = lastFailedConnectId || normalizeAeroId(remoteIdInput.value);
  if (!isValidAeroId(remoteId)) {
    hideConnectRetry();
    return;
  }

  remoteIdInput.value = remoteId;
  connectToPeer(remoteId);
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
    platformApi.vibrate("light");
    messageInput.value = "";
    syncComposerAction();
    sendTypingState(activePeerId, false, { force: true });
    messageInput.focus();
  }
});

voiceRecordButton.addEventListener("click", () => {
  startVoiceRecording();
});

emojiPickerButton.addEventListener("click", () => {
  const opening = emojiPickerPopover.classList.contains("hidden");
  void setEmojiPickerOpen(opening);
});

document.addEventListener("pointerdown", (event) => {
  if (
    !emojiPickerPopover.classList.contains("hidden") &&
    !emojiPickerPopover.contains(event.target) &&
    !emojiPickerButton.contains(event.target)
  ) {
    void setEmojiPickerOpen(false);
  }
  if (
    !emojiShortcodePopover.classList.contains("hidden") &&
    !emojiShortcodePopover.contains(event.target) &&
    !messageInput.contains(event.target)
  ) {
    closeEmojiShortcodeSuggestions();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !emojiPickerPopover.classList.contains("hidden")) {
    void setEmojiPickerOpen(false);
    emojiPickerButton.focus();
  }
});

clearChat.addEventListener("click", async () => {
  if (activePeerId) {
    const peerId = activePeerId;
    const activeConn = connections.get(peerId);
    const confirmed = await showAppDialog({
      title: "Clear chat",
      message: `Clear chat with ${getPeerLabel(peerId, activeConn)}?`,
      confirmText: "Clear",
      cancelText: "Cancel",
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    chatHistory.set(peerId, []);
  }
  renderChatHistory();
});

messageInput.addEventListener("input", () => {
  syncComposerAction();
  void refreshEmojiShortcodeSuggestions();
  if (!activePeerId || messageInput.disabled) {
    return;
  }

  const hasText = messageInput.value.trim().length > 0;
  sendTypingState(activePeerId, hasText);
  if (hasText) {
    scheduleLocalTypingStop(activePeerId);
  } else {
    sendTypingState(activePeerId, false, { force: true });
  }
});

messageInput.addEventListener("keydown", (event) => {
  if (emojiShortcodePopover.classList.contains("hidden") || !emojiShortcodeSuggestions.length) {
    return;
  }
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const offset = event.key === "ArrowDown" ? 1 : -1;
    emojiShortcodeSelection = (emojiShortcodeSelection + offset + emojiShortcodeSuggestions.length) % emojiShortcodeSuggestions.length;
    renderEmojiShortcodeSuggestions(emojiShortcodeSuggestions);
    return;
  }
  if (event.key === "Tab" || event.key === "Enter") {
    event.preventDefault();
    insertEmojiShortcodeSuggestion(emojiShortcodeSuggestions[emojiShortcodeSelection]);
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    closeEmojiShortcodeSuggestions();
  }
});

contactSearchInput?.addEventListener("input", () => {
  refreshPeers();
});

callChat.addEventListener("click", () => {
  if (
    isActionOnCooldown(
      "call",
      CALL_ACTION_COOLDOWN_MS,
      "Please wait before changing call state.",
    )
  ) {
    return;
  }
  startVoiceCall();
});

screenCallAccept.addEventListener("click", () => {
  acceptVoiceCall();
});

screenCallIgnore.addEventListener("click", () => {
  incomingCallScreen?.classList.add("hidden");
  stopLocalRingtone();
});

screenCallDecline.addEventListener("click", () => {
  declineVoiceCall();
});

callAccept.addEventListener("click", () => {
  if (
    isActionOnCooldown(
      "call",
      CALL_ACTION_COOLDOWN_MS,
      "Please wait before changing call state.",
    )
  ) {
    return;
  }
  acceptVoiceCall();
});

callDecline.addEventListener("click", () => {
  if (
    isActionOnCooldown(
      "call",
      CALL_ACTION_COOLDOWN_MS,
      "Please wait before changing call state.",
    )
  ) {
    return;
  }
  declineVoiceCall();
});

callMute.addEventListener("click", () => {
  setCallMuted(!callState.muted);
});

callDeafen.addEventListener("click", () => {
  setCallDeafened(!callState.deafened);
});

callCamera.addEventListener("click", () => {
  setLocalCameraEnabled(!callState.localCameraEnabled);
});

callStream.addEventListener("click", () => {
  if (screenShareState.localStream) {
    stopLocalScreenShare({
      notifyPeer: true,
      message: "Screen stream stopped.",
    });
    return;
  }

  openStreamSetup();
});

callHangup.addEventListener("click", () => {
  if (
    isActionOnCooldown(
      "call",
      CALL_ACTION_COOLDOWN_MS,
      "Please wait before changing call state.",
    )
  ) {
    return;
  }
  endVoiceCall({ notifyPeer: true, message: "Voice call ended." });
});

localParticipantCard?.addEventListener("contextmenu", (event) => {
  if (screenShareState.localStream) {
    openStreamMenu(event, "local");
    return;
  }
  openParticipantMenu(event, "local");
});

remoteParticipantCard?.addEventListener("contextmenu", (event) => {
  if (screenShareState.remoteStream) {
    openStreamMenu(event, "remote");
    return;
  }
  openParticipantMenu(event, "remote");
});

localStreamFullscreen?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleStreamFullscreen("local");
});

remoteStreamFullscreen?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleStreamFullscreen("remote");
});

streamModalClose.addEventListener("click", closeStreamSetup);

streamModal.addEventListener("click", (event) => {
  if (event.target === streamModal) {
    closeStreamSetup();
  }
});

streamTabScreens.addEventListener("click", () => {
  setActiveStreamSourceTab("screens");
  renderScreenSources();
});

streamTabWindows.addEventListener("click", () => {
  setActiveStreamSourceTab("windows");
  renderScreenSources();
});

streamStartButton.addEventListener("click", async () => {
  if (!selectedScreenSource) {
    return;
  }

  const source = selectedScreenSource;
  const options = {
    quality: normalizeScreenQuality(streamQualitySelect.value),
    fps: normalizeScreenFps(streamFpsSelect.value),
    audio: streamAudioToggle.checked,
  };
  closeStreamSetup();
  await startLocalScreenShare(source, options);
});

streamMenuQuality.addEventListener("click", () => {
  openStreamSetup({ reuseCurrent: true });
});

streamMenuSource.addEventListener("click", () => {
  openStreamSetup();
});

streamMenuAudio.addEventListener("click", () => {
  openStreamSetup({ reuseCurrent: true });
});

streamMenuWatch.addEventListener("click", () => {
  setRemoteScreenWatching(
    !screenShareState.viewerWatching || screenShareState.hiddenByViewer,
  );
  closeStreamMenu();
});

streamMenuFullscreen.addEventListener("click", () => {
  if (contextStreamTarget) {
    toggleStreamFullscreen(contextStreamTarget);
  }
  closeStreamMenu();
});

streamMenuStop.addEventListener("click", () => {
  stopLocalScreenShare({ notifyPeer: true, message: "Screen stream stopped." });
  closeStreamMenu();
});

disconnectChat.addEventListener("click", () => {
  if (!activePeerId) {
    return;
  }

  const conn = connections.get(activePeerId);
  const peerLabel = getPeerLabel(activePeerId, conn);
  conn?.close();
  removePeer(activePeerId);
  setStatus(
    connections.size > 0 ? "online" : "pending",
    connections.size > 0 ? "Peer connected" : "Ready to connect",
  );
  addSystemMessage(`Disconnected from ${peerLabel}.`);
  refreshPeers();
});

welcomeNickname.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    welcomeNext.click();
  }
});

welcomeThemeSystem.addEventListener("change", () => {
  if (welcomeThemeSystem.checked) {
    saveAppSettings({ theme: "system" });
  }
});

welcomeThemeLight.addEventListener("change", () => {
  if (welcomeThemeLight.checked) {
    saveAppSettings({ theme: "light" });
  }
});

welcomeThemeDark.addEventListener("change", () => {
  if (welcomeThemeDark.checked) {
    saveAppSettings({ theme: "dark" });
  }
});

welcomeAccentColorSelect.addEventListener("change", () => {
  saveAppSettings({ accentColor: welcomeAccentColorSelect.value });
});

welcomeCustomAccentColorInput.addEventListener("input", () => {
  saveAppSettings({
    accentColor: "custom",
    customAccentColor: welcomeCustomAccentColorInput.value,
  });
});

welcomeMicrophoneSelect.addEventListener("change", () => {
  appConfig.audio.inputDeviceId = welcomeMicrophoneSelect.value || "default";
  microphoneSelect.value = appConfig.audio.inputDeviceId;
  syncEnhancedSelect(microphoneSelect);
  saveAudioConfig();
  scheduleVoiceSettingsReapply();
});

welcomeCameraSelect.addEventListener("change", () => {
  appConfig.audio.cameraDeviceId = welcomeCameraSelect.value || "default";
  cameraSelect.value = appConfig.audio.cameraDeviceId;
  syncEnhancedSelect(cameraSelect);
  saveAudioConfig();
  if (callState.localCameraEnabled) {
    setLocalCameraEnabled(true);
  }
});

welcomeSpeakerSelect.addEventListener("change", async () => {
  appConfig.audio.outputDeviceId = welcomeSpeakerSelect.value || "default";
  speakerSelect.value = appConfig.audio.outputDeviceId;
  syncEnhancedSelect(speakerSelect);
  saveAudioConfig();
  await applyAudioOutputDevice();
});

welcomeDetectDevices.addEventListener("click", detectWelcomeDevices);

welcomeAutostartToggle.addEventListener("change", () => {
  saveAppSettings({ autostart: welcomeAutostartToggle.checked });
});

welcomeAutostartOpen.addEventListener("change", () => {
  if (welcomeAutostartOpen.checked) {
    saveAppSettings({ startHidden: false });
  }
});

welcomeAutostartHidden.addEventListener("change", () => {
  if (welcomeAutostartHidden.checked) {
    saveAppSettings({ startHidden: true });
  }
});

welcomeBack.addEventListener("click", () => {
  if (currentWelcomeStep > 0) {
    currentWelcomeStep -= 1;
    renderWelcomeStep();
  }
});

welcomeNext.addEventListener("click", async () => {
  welcomeNext.disabled = true;
  try {
    const lastStep = welcomePages.length - 1;
    if (currentWelcomeStep === lastStep && !(await saveWelcomeNickname())) {
      return;
    }

    if (currentWelcomeStep < lastStep) {
      currentWelcomeStep += 1;
      renderWelcomeStep();
      if (currentWelcomeStep === 1) {
        await refreshAudioDevices();
      }
      return;
    }

    await finishWelcomeSetup();
  } finally {
    welcomeNext.disabled = false;
  }
});

microphoneSelect.addEventListener("change", () => {
  appConfig.audio.inputDeviceId = microphoneSelect.value || "default";
  saveAudioConfig();
  scheduleVoiceSettingsReapply();
});

cameraSelect.addEventListener("change", () => {
  appConfig.audio.cameraDeviceId = cameraSelect.value || "default";
  saveAudioConfig();
  if (callState.localCameraEnabled) {
    setLocalCameraEnabled(true);
  }
});

speakerSelect.addEventListener("change", async () => {
  appConfig.audio.outputDeviceId = speakerSelect.value || "default";
  saveAudioConfig();
  await applyAudioOutputDevice();
});

micProfileSelect.addEventListener("change", () => {
  setMicProfile(micProfileSelect.value || "voice-isolation", { persist: true });
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
  setMicNoiseReduction(Number(micNoiseReductionSlider.value || 0), {
    persist: true,
  });
});

micEqLowSlider.addEventListener("input", () => {
  setMicEqBand("low", Number(micEqLowSlider.value || 0));
});

micEqLowSlider.addEventListener("change", () => {
  setMicEqBand("low", Number(micEqLowSlider.value || 0), { persist: true });
});

micEqMidSlider.addEventListener("input", () => {
  setMicEqBand("mid", Number(micEqMidSlider.value || 0));
});

micEqMidSlider.addEventListener("change", () => {
  setMicEqBand("mid", Number(micEqMidSlider.value || 0), { persist: true });
});

micEqHighSlider.addEventListener("input", () => {
  setMicEqBand("high", Number(micEqHighSlider.value || 0));
});

micEqHighSlider.addEventListener("change", () => {
  setMicEqBand("high", Number(micEqHighSlider.value || 0), { persist: true });
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

participantVolumeSlider?.addEventListener("input", () => {
  if (!callState.peerId) {
    return;
  }

  const nextVolume = Number(participantVolumeSlider.value || 100);
  participantVolumeValue.textContent = `${nextVolume}%`;
  setPeerPlaybackVolume(callState.peerId, nextVolume);
});

participantToggleName?.addEventListener("click", () => {
  if (!contextParticipantTarget) {
    return;
  }

  const nextValue =
    participantToggleName.getAttribute("aria-checked") !== "true";
  participantToggleName.setAttribute("aria-checked", String(nextValue));
  if (contextParticipantTarget === "local") {
    setOwnVideoNameVisible(nextValue);
  } else if (callState.peerId) {
    setPeerVideoNameVisible(callState.peerId, nextValue);
  }
  refreshCallStage();
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

themeLight.addEventListener("change", () => {
  if (themeLight.checked) {
    saveAppSettings({ theme: "light" });
  }
});

themeDark.addEventListener("change", () => {
  if (themeDark.checked) {
    saveAppSettings({ theme: "dark" });
  }
});

themeSystem.addEventListener("change", () => {
  if (themeSystem.checked) {
    saveAppSettings({ theme: "system" });
  }
});

accentColorSelect.addEventListener("change", () => {
  saveAppSettings({ accentColor: accentColorSelect.value });
});

customAccentColorInput.addEventListener("input", () => {
  appConfig.appSettings.accentColor = "custom";
  appConfig.appSettings.customAccentColor = customAccentColorInput.value;
  applyAppearancePreferences();
});

customAccentColorInput.addEventListener("change", () => {
  saveAppSettings({
    accentColor: "custom",
    customAccentColor: customAccentColorInput.value,
  });
});

messageDensitySelect.addEventListener("change", () => {
  saveAppSettings({ messageDensity: messageDensitySelect.value });
});

chatFontSizeSelect.addEventListener("change", () => {
  saveAppSettings({ chatFontSize: chatFontSizeSelect.value });
});

compactLayoutToggle.addEventListener("change", () => {
  saveAppSettings({ compactLayout: compactLayoutToggle.checked });
});

reduceMotionToggle.addEventListener("change", () => {
  saveAppSettings({ reducedMotion: reduceMotionToggle.checked });
});

resetSidebarWidthButton.addEventListener("click", () => {
  setSidebarWidth(DEFAULT_SIDEBAR_WIDTH, { persist: true });
});

for (const button of themeTabButtons) {
  button.addEventListener("click", () => selectThemeTab(button.dataset.themeTab));
}

applyOnlineThemesButton?.addEventListener("click", async () => {
  const urls = normalizeOnlineThemeUrls(onlineThemeUrlsInput?.value);
  const enteredLines = String(onlineThemeUrlsInput?.value || "")
    .split(/\r?\n/)
    .filter((line) => line.trim()).length;
  if (enteredLines !== urls.length) {
    onlineThemeStatus.textContent = "Only valid HTTPS URLs are kept (up to 8).";
  }
  applyOnlineThemesButton.disabled = true;
  try {
    appConfig.appSettings.onlineThemeUrls = urls;
    await applyAllThemes();
    saveAppSettings({ onlineThemeUrls: urls });
  } finally {
    applyOnlineThemesButton.disabled = false;
  }
});

openThemesFolderButton?.addEventListener("click", async () => {
  const result = await platformApi.openThemesFolder();
  if (!result?.ok) {
    await showAppDialog({
      title: "Themes folder",
      message: "The Themes folder could not be opened. Please try again.",
      confirmText: "OK",
      cancelText: "Close",
    });
  }
});

reloadThemesButton?.addEventListener("click", async () => {
  if (reloadThemesButton.disabled) return;
  reloadThemesButton.disabled = true;
  reloadThemesButton.classList.add("is-loading");
  try {
    await refreshCustomThemes();
  } finally {
    reloadThemesButton.disabled = false;
    reloadThemesButton.classList.remove("is-loading");
  }
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
  saveNotificationSettings({
    showWhenFocused: focusedNotificationsToggle.checked,
  });
});

readReceiptsToggle.addEventListener("change", () => {
  saveAppSettings({ readReceipts: readReceiptsToggle.checked });
  broadcastReceiptSettings();
  renderChatHistory();
  if (readReceiptsToggle.checked) {
    sendReadReceiptsForActiveChat();
  }
});

voiceAutoDownloadToggle.addEventListener("change", () => {
  saveAppSettings({ voiceAutoDownload: voiceAutoDownloadToggle.checked });
});

voiceWaveformToggle.addEventListener("change", () => {
  saveAppSettings({ voiceWaveform: voiceWaveformToggle.checked });
  renderChatHistory();
});

clearTrustedDomainsButton.addEventListener("click", async () => {
  if (!appConfig.appSettings.trustedLinkDomains.length) return;
  const confirmed = await showAppDialog({
    title: "Clear trusted domains?",
    message: "Links from these domains will ask for confirmation again.",
    confirmText: "Clear",
    cancelText: "Cancel",
    danger: true,
  });
  if (confirmed) await saveAppSettings({ trustedLinkDomains: [] });
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

platformApi.onNotificationAction((action) => {
  if (!action || typeof action !== "object") {
    return;
  }

  const peerId = String(action.peerId || "");
  if (action.type === "open" && connections.has(peerId)) {
    activePeerId = peerId;
    unreadCounts.delete(peerId);
    renderChatHistory();
    refreshPeers();
    setMobileTab("chat");
    messageInput.focus();
    return;
  }

  if (action.type === "reply" && connections.has(peerId)) {
    sendChatText(peerId, action.text);
    return;
  }

  if (
    action.type === "accept-call" &&
    callState.status === "incoming" &&
    callState.peerId === peerId
  ) {
    activePeerId = peerId;
    unreadCounts.delete(peerId);
    renderChatHistory();
    refreshPeers();
    setMobileTab("chat");
    acceptVoiceCall();
    return;
  }

  if (
    action.type === "decline-call" &&
    callState.status === "incoming" &&
    callState.peerId === peerId
  ) {
    declineVoiceCall();
  }
});

function openLinuxUpdateModal() {
  const required = Boolean(availableUpdate?.mandatory);
  updateModal.dataset.required = String(required);
  modalText.textContent = required
    ? `Update to version ${availableUpdate.minimumVersion} or later to continue.`
    : `Update ${appDisplayName} to version ${availableUpdate?.version ?? "latest"}. Use the installed command first, or reinstall through the official installer while keeping your settings.`;
  modalClose.classList.toggle("hidden", required);
  linuxCommand.textContent = linuxInstallCommand;
  linuxWebsiteCommand.textContent = linuxWebsiteUpdateCommand;
  updateModal.classList.remove("hidden");
}

function setUpdateButtonText(text) {
  updateButton.textContent = text;
  headerUpdateButton.textContent = text;
}

function startUpdateProgressListener() {
  removeUpdateProgressListener?.();
  removeUpdateProgressListener =
    platformApi.onUpdateProgress((progress) => {
      if (progress?.phase === "download") {
        const percent = Number.isFinite(progress.percent) ? progress.percent : 0;
        const percentText = percent > 0 ? `${percent}%` : "...";
        setUpdateButtonText(`Downloading ${percentText}`);
        startupUpdateButton.textContent = `Downloading ${percentText}`;
        
        // Show progress containers
        const pCard = document.getElementById("update-progress-container");
        const pStartup = document.getElementById("startup-update-progress-container");
        if (pCard) pCard.classList.remove("hidden");
        if (pStartup) pStartup.classList.remove("hidden");
        
        // Update bar widths
        const pCardBar = document.getElementById("update-progress-bar");
        const pStartupBar = document.getElementById("startup-update-progress-bar");
        if (pCardBar) pCardBar.style.width = `${percent}%`;
        if (pStartupBar) pStartupBar.style.width = `${percent}%`;
        
        return;
      }

      if (progress?.phase === "install") {
        setUpdateButtonText("Starting setup...");
        startupUpdateButton.textContent = "Starting setup...";
        return;
      }

      if (progress?.phase === "verify") {
        setUpdateButtonText("Verifying...");
        startupUpdateButton.textContent = "Verifying...";
      }
    }) || null;
}

function stopUpdateProgressListener() {
  removeUpdateProgressListener?.();
  removeUpdateProgressListener = null;
  
  // Hide progress containers
  const pCard = document.getElementById("update-progress-container");
  const pStartup = document.getElementById("startup-update-progress-container");
  if (pCard) pCard.classList.add("hidden");
  if (pStartup) pStartup.classList.add("hidden");
}

async function installAvailableUpdate() {
  if (!availableUpdate) {
    window.open(latestReleaseUrl, "_blank", "noopener");
    return;
  }

  if (platformApi.supportsNativeUpdateInstall || platformApi.isAndroid) {
    updateButton.disabled = true;
    headerUpdateButton.disabled = true;
    startUpdateProgressListener();
    setUpdateButtonText("Downloading 0%");
    startupUpdateButton.textContent = "Downloading 0%";

    try {
      const androidUrl = platformApi.isAndroid
        ? `${githubRepoUrl}/releases/download/v${availableUpdate.version}/${projectConfig.release?.androidApkAsset || "Aero-P2P-Chat-Android.apk"}`
        : "";

      await platformApi.installUpdate({
        url: platformApi.isAndroid ? androidUrl : availableUpdate.windowsUrl,
        version: availableUpdate.version,
        sha256: availableUpdate.windowsSha256,
        sha512: availableUpdate.windowsSha512,
        onlineInstallerUrl: availableUpdate.onlineInstallerUrl,
        onlineInstallerSha256: availableUpdate.onlineInstallerSha256,
        onlineInstallerSha512: availableUpdate.onlineInstallerSha512,
      });
      if (platformApi.isAndroid) {
        setUpdateButtonText("Installer opened");
        startupUpdateButton.textContent = "Installer opened";
      } else {
        setUpdateButtonText("Updater started");
        startupUpdateButton.textContent = "Updater started";
      }
    } catch (error) {
      stopUpdateProgressListener();
      updateButton.disabled = false;
      headerUpdateButton.disabled = false;
      updateButton.textContent = "Install update";
      headerUpdateButton.textContent = "Update";
      startupUpdateButton.disabled = false;
      if (!availableUpdate?.mandatory) {
        startupUpdateIgnoreButton.classList.remove("hidden");
        startupUpdateClose.classList.remove("hidden");
      }
      startupUpdateButton.textContent = "Retry update";
      setStatus("offline", error.message || "Update failed.");
    }
    return;
  }

  if (platform === "darwin") {
    window.open(availableUpdate.macosUrl || latestReleaseUrl, "_blank", "noopener");
    return;
  }

  if (platform === "linux") {
    openLinuxUpdateModal();
    return;
  }

  window.open(latestReleaseUrl, "_blank", "noopener");
}

headerUpdateButton.addEventListener("click", installAvailableUpdate);
updateButton.addEventListener("click", installAvailableUpdate);
updateIgnoreButton.addEventListener("click", ignoreAvailableUpdateHint);
startupUpdateClose.addEventListener("click", () => {
  if (!availableUpdate?.mandatory) {
    startupUpdateModal.classList.add("hidden");
  }
});
startupUpdateModal.addEventListener("click", (event) => {
    if (
      event.target === startupUpdateModal &&
      !startupUpdateButton.disabled &&
      !availableUpdate?.mandatory
    ) {
      startupUpdateModal.classList.add("hidden");
    }
  });
startupUpdateButton.addEventListener("click", () => {
    if (platformApi.supportsNativeUpdateInstall || platformApi.isAndroid) {
      startupUpdateButton.disabled = true;
      startupUpdateIgnoreButton.classList.add("hidden");
      startupUpdateClose.classList.add("hidden");
    } else if (!availableUpdate?.mandatory) {
      startupUpdateModal.classList.add("hidden");
    }
    installAvailableUpdate();
  });
startupUpdateIgnoreButton.addEventListener("click", () => {
  if (availableUpdate?.mandatory) return;
  startupUpdateModal.classList.add("hidden");
  ignoreAvailableUpdateHint();
});

appMenuUpdate.addEventListener("click", () => {
    if (availableUpdate) {
      startupUpdateModalShownForVersion = availableUpdate.version;
      startupUpdateModal.dataset.required = String(availableUpdate.mandatory);
      startupUpdateTitle.textContent = availableUpdate.mandatory
        ? "Update required"
        : "Update available";
      startupUpdateText.textContent = availableUpdate.mandatory
        ? `Version ${availableUpdate.minimumVersion} or later is required to continue.`
        : `Version ${availableUpdate.version} is ready. You are using ${currentVersion}.`;
      startupUpdateIgnoreButton.classList.toggle("hidden", availableUpdate.mandatory);
      startupUpdateClose.classList.toggle("hidden", availableUpdate.mandatory);
      startupUpdateButton.textContent = platformApi.supportsNativeUpdateInstall
        ? "Install update"
        : platform === "linux"
          ? "Show command"
          : "Open release";
      startupUpdateModal.classList.remove("hidden");
    } else if (!platformApi.supportsUpdateChecks) {
    window.open(latestReleaseUrl, "_blank", "noopener");
  } else {
    checkForUpdates({ manual: true });
  }
  closeAppMenu();
});
appMenuUpdateIgnore.addEventListener("click", () => {
  ignoreAvailableUpdateHint();
  closeAppMenu();
});

appMenuStatus.addEventListener("click", () => {
  closeAppMenu();
  window.open(newsPageUrl, "_blank", "noopener");
});

appMenuOnline?.addEventListener("click", () => {
  setPresenceStatus("online", { persist: true });
  closeAppMenu();
});

appMenuDnd?.addEventListener("click", () => {
  setPresenceStatus("dnd", { persist: true });
  closeAppMenu();
});

appMenuOffline?.addEventListener("click", () => {
  setPresenceStatus("offline", { persist: true });
  closeAppMenu();
});

windowMinimize.addEventListener("click", () => {
  platformApi.windowControl("minimize");
});

function updateWindowMaximizeButton(maximized) {
  const label = maximized ? "Restore" : "Maximize";
  windowMaximize.title = label;
  windowMaximize.setAttribute("aria-label", label);
  const icon = windowMaximize.querySelector("i");
  if (icon) {
    icon.className = maximized
      ? "fa-regular fa-window-restore"
      : "fa-regular fa-square";
  }
}

async function syncWindowMaximizeButton(action = "status") {
  const result = await platformApi.windowControl(action);
  if (result?.ok) {
    updateWindowMaximizeButton(Boolean(result.maximized));
  }
}

windowMaximize.addEventListener("click", () => {
  void syncWindowMaximizeButton("maximize");
});

window.addEventListener("resize", () => {
  void syncWindowMaximizeButton();
});

void syncWindowMaximizeButton();

windowClose.addEventListener("click", () => {
  platformApi.windowControl("close");
});

modalClose.addEventListener("click", () => {
  if (!availableUpdate?.mandatory) {
    updateModal.classList.add("hidden");
  }
});

updateModal.addEventListener("click", (event) => {
  if (event.target === updateModal && !availableUpdate?.mandatory) {
    updateModal.classList.add("hidden");
  }
});

copyUpdateCommands.forEach((button) => {
  button.addEventListener("click", async () => {
    const command = linuxUpdateCommands[button.dataset.updateCommand];
    if (!command) return;

    try {
      await writeClipboardText(command);
      button.textContent = "Copied";
    } catch {
      button.textContent = "Copy failed";
    }

    setTimeout(() => {
      button.textContent = "Copy command";
    }, 1200);
  });
});

titlebarLogo.addEventListener("contextmenu", openAppMenu);

titlebarLogo.addEventListener("click", openAppMenu);

titlebarLogo.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    openAppMenu(event);
  }
});

appMenuProfile.addEventListener("click", () => {
  profileNickname.value = identity.nickname || "";
  const avatar = normalizeAvatarConfig(identity.avatar);
  setProfileAvatarTemplate(avatar.template);
  profileAvatarColor.value = avatar.color;
  profileAvatarDecoration.value = avatar.decoration;
  profileAvatarInitial.checked = avatar.showInitial;
  const nameStyle = normalizeNameStyle(identity.nameStyle);
  profileNameFont.value = nameStyle.font;
  profileNameThemeColor.checked = nameStyle.useThemeColor;
  profileNameColor.value = nameStyle.color || getThemeNameColor();
  syncProfileAvatarColor();
  syncProfileNameColor();
  syncProfileNameColorMode();
  renderProfileNamePreviews();
  syncEnhancedSelect(profileAvatarDecoration);
  syncEnhancedSelect(profileNameFont);
  profileId.textContent = identity.id;
  renderProfileAvatarPreview();
  profileModal.classList.remove("hidden");
  closeAppMenu();
  profileNickname.focus();
});

profileClose.addEventListener("click", () => {
  profileModal.classList.add("hidden");
  closeProfileTemplatePicker();
});

profileModal.addEventListener("click", (event) => {
  if (event.target === profileModal) {
    profileModal.classList.add("hidden");
    closeProfileTemplatePicker();
  }
});

const PROFILE_TEMPLATE_LABELS = {
  unique: "Unique",
  solid: "Solid",
  gradient: "Gradient",
  rings: "Rings",
};

function setProfileAvatarTemplate(value) {
  const template = normalizeAvatarConfig({ template: value }).template;
  profileAvatarTemplate.value = template;
  profileTemplateLabel.textContent = PROFILE_TEMPLATE_LABELS[template];
  profileColorField.classList.toggle("hidden", template === "unique");
  for (const option of profileTemplateOptionButtons) {
    option.setAttribute(
      "aria-selected",
      option.dataset.avatarTemplate === template ? "true" : "false",
    );
  }
}

function closeProfileTemplatePicker() {
  profileTemplateOptions.classList.add("hidden");
  profileTemplateToggle.setAttribute("aria-expanded", "false");
}

function syncProfileAvatarColor() {
  profileAvatarColorValue.value = profileAvatarColor.value.toLowerCase();
  profileAvatarColorValue.textContent = profileAvatarColor.value.toLowerCase();
}

function syncProfileNameColor() {
  profileNameColorValue.value = profileNameColor.value.toLowerCase();
  profileNameColorValue.textContent = profileNameColor.value.toLowerCase();
}

function getThemeNameColor() {
  const color = getComputedStyle(document.documentElement)
    .getPropertyValue("--text")
    .trim();
  return /^#[a-f0-9]{6}$/i.test(color) ? color : "#20242c";
}

function syncProfileNameColorMode() {
  const useThemeColor = profileNameThemeColor.checked;
  profileNameColorField.classList.toggle("hidden", useThemeColor);
  profileNameColor.disabled = useThemeColor;
}

function renderProfileNamePreviews() {
  const label = sanitizeNickname(profileNickname.value) || "Your name";
  const style = getProfileNameStyleDraft();
  for (const preview of [profileNamePreviewLight, profileNamePreviewDark]) {
    preview.textContent = label;
    applyNameAppearance(preview, style);
  }
}

function getProfileAvatarDraft() {
  return normalizeAvatarConfig({
    template: profileAvatarTemplate.value,
    color: profileAvatarColor.value,
    decoration: profileAvatarDecoration.value,
    showInitial: profileAvatarInitial.checked,
  });
}

function getProfileNameStyleDraft() {
  return normalizeNameStyle({
    font: profileNameFont.value,
    color: profileNameThemeColor.checked ? "" : profileNameColor.value,
    useThemeColor: profileNameThemeColor.checked,
  });
}

function renderProfileAvatarPreview() {
  const avatar = getProfileAvatarDraft();
  applyAvatarAppearance(profileAvatarPreview, identity.id, avatar);
  profileAvatarPreview.textContent = avatar.showInitial
    ? (profileNickname.value || identity.id).charAt(0).toUpperCase()
    : "";
}

function broadcastProfileUpdate() {
  for (const conn of connections.values()) {
    sendProtocolMessage(conn, "profile-update");
  }
  for (const entry of pendingConnections.values()) {
    sendProtocolMessage(entry.conn, "profile-update");
  }
}

function saveProfile() {
  identity.nickname = sanitizeNickname(profileNickname.value);
  identity.avatar = getProfileAvatarDraft();
  identity.nameStyle = getProfileNameStyleDraft();
  appConfig.identity = identity;
  saveAppConfig();
  updateTitlebarPresenceIndicator();
  refreshPeers();
  refreshCallStage();
  broadcastProfileUpdate();
  profileModal.classList.add("hidden");
  setStatus("pending", "Profile saved and shared with connected chat partners.");
}

function resetProfileToDefault() {
  identity.nickname = "";
  identity.avatar = normalizeAvatarConfig();
  identity.nameStyle = normalizeNameStyle();
  appConfig.identity = identity;
  saveAppConfig();
  updateTitlebarPresenceIndicator();
  refreshPeers();
  refreshCallStage();
  broadcastProfileUpdate();
  profileModal.classList.add("hidden");
  setStatus("pending", "Profile reset to default and shared with connected chat partners.");
}

profileNickname.addEventListener("input", () => {
  renderProfileAvatarPreview();
  renderProfileNamePreviews();
});
profileTemplateToggle.addEventListener("click", () => {
  const willOpen = profileTemplateOptions.classList.contains("hidden");
  profileTemplateOptions.classList.toggle("hidden", !willOpen);
  profileTemplateToggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
});
profileTemplateOptionButtons.forEach((option) => {
  option.addEventListener("click", () => {
    setProfileAvatarTemplate(option.dataset.avatarTemplate);
    closeProfileTemplatePicker();
    renderProfileAvatarPreview();
    profileTemplateToggle.focus();
  });
});
document.addEventListener("pointerdown", (event) => {
  if (!event.target.closest(".profile-template-picker")) {
    closeProfileTemplatePicker();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !profileTemplateOptions.classList.contains("hidden")) {
    event.preventDefault();
    closeProfileTemplatePicker();
    profileTemplateToggle.focus();
  }
});
profileAvatarColor.addEventListener("input", () => {
  syncProfileAvatarColor();
  renderProfileAvatarPreview();
});
profileAvatarDecoration.addEventListener("change", renderProfileAvatarPreview);
profileAvatarInitial.addEventListener("change", renderProfileAvatarPreview);
profileNameColor.addEventListener("input", () => {
  syncProfileNameColor();
  renderProfileNamePreviews();
});
profileNameThemeColor.addEventListener("change", () => {
  syncProfileNameColorMode();
  renderProfileNamePreviews();
});
profileNameFont.addEventListener("change", renderProfileNamePreviews);
profileReset.addEventListener("click", resetProfileToDefault);
profileSave.addEventListener("click", saveProfile);

appMenuSettings.addEventListener("click", () => {
  if (platformApi.isElectron) {
    openSettings();
  } else {
    setMobileTab("settings");
  }
  closeAppMenu();
});

mobileTabContacts?.addEventListener("click", () => {
  setMobileTab("contacts");
});

mobileTabChat?.addEventListener("click", () => {
  setMobileTab("chat");
});

mobileTabSettings?.addEventListener("click", () => {
  setMobileTab("settings");
});

function openFeedbackWidget() {
  if (typeof window.uj?.showWidget === "function") {
    window.uj.showWidget({ section: "feedback" });
    return;
  }

  // The Chrome extension deliberately does not ship UserJot's remotely
  // hosted SDK. Keep feedback available there by opening the feedback page.
  window.open(newsPageUrl, "_blank", "noopener");
}

feedbackButton?.addEventListener("click", openFeedbackWidget);
mobileFeedbackButton?.addEventListener("click", openFeedbackWidget);

for (const item of settingsNavItems) {
  item.addEventListener("click", () => selectSettingsPage(item.dataset.settingsNav));
}

settingsClose.addEventListener("click", () => {
  settingsModal.classList.add("hidden");
  if (!platformApi.isElectron) {
    setMobileTab("contacts");
  }
});

settingsModal.addEventListener("click", (event) => {
  if (event.target === settingsModal && platformApi.isElectron) {
    settingsModal.classList.add("hidden");
  }
});

resetAllSettingsButton.addEventListener("click", async () => {
  const confirmed = await showAppDialog({
    title: "Reset all settings?",
    message:
      "Defaults will be restored and setup will start again. Your Aero ID, contacts and chats will stay.",
    confirmText: "Reset settings",
    cancelText: "Cancel",
    danger: true,
  });
  if (!confirmed) {
    return;
  }

  appConfig.appSettings = { welcomeScreen: true };
  appConfig.audio = {};
  appConfig.notificationSettings = {};
  appConfig.soundSettings = {};
  appConfig.callUi = {};
  identity.nickname = "";
  appConfig.identity = identity;

  normalizeAppSettings();
  normalizeAudioConfig();
  renderAppSettings();
  renderAudioSettings();
  refreshCallStage();
  setPresenceStatus("online", { force: true });
  scheduleVoiceSettingsReapply();
  await applyAudioOutputDevice();
  await saveAppConfig();

  settingsModal.classList.add("hidden");
  if (!platformApi.isElectron) {
    setMobileTab("contacts");
  }
  openWelcomeScreen();
});




menuTrust.addEventListener("click", () => {
  if (!contextContactId) {
    return;
  }


  const nextValue = !isTrusted(contextContactId);
  setTrusted(contextContactId, nextValue);
  addSystemMessage(
    `${findContact(contextContactId)?.label || contextContactId} ${nextValue ? "trusted" : "untrusted"}.`,
  );
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
  if (!participantMenu.contains(event.target)) {
    closeParticipantMenu();
  }
  if (!streamMenu.contains(event.target)) {
    closeStreamMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAppMenu();
    closeContactMenu();
    closeMessageMenu();
    closeParticipantMenu();
    closeStreamMenu();
    if (!availableUpdate?.mandatory) {
      updateModal.classList.add("hidden");
    }
    settingsModal.classList.add("hidden");
    closeStreamSetup();
  }
});

window.addEventListener("focus", () => {
  refreshNotificationState();
  sendReadReceiptsForActiveChat();
});

window.addEventListener("blur", refreshNotificationState);

document.addEventListener("visibilitychange", () => {
  refreshNotificationState();
  if (document.visibilityState === "visible") {
    sendReadReceiptsForActiveChat();
  }
});

refreshNotificationState();
setInterval(refreshNotificationState, 15000);

let realtimeCleanupStarted = false;

function cleanupRealtimeConnections({ deferClose = false } = {}) {
  if (realtimeCleanupStarted) {
    return;
  }

  realtimeCleanupStarted = true;
  endVoiceCall({ notifyPeer: true });

  const openConnections = Array.from(connections.values()).filter(
    (conn) => conn?.open,
  );
  const pendingEntries = Array.from(pendingConnections.values());
  for (const conn of openConnections) {
    sendProtocolMessage(conn, "connection-closed");
  }

  const closeAll = () => {
    for (const peerId of connectionHeartbeats.keys()) {
      stopConnectionHeartbeat(peerId);
    }
    for (const conn of connections.values()) {
      conn.close();
    }
    for (const entry of pendingEntries) {
      entry.conn.close();
    }
    connections.clear();
    pendingConnections.clear();
    peer?.destroy();
    if (deferClose) {
      platformApi.realtimeCleanupComplete();
    }
  };

  if (deferClose && openConnections.length > 0) {
    setTimeout(closeAll, 350);
  } else {
    closeAll();
  }
}

platformApi.onSystemShutdown(() => {
  cleanupRealtimeConnections({ deferClose: true });
});

window.addEventListener("beforeunload", () => {
  cleanupRealtimeConnections();
});

writeDevLog("Renderer ready.");
refreshPeers();
refreshAudioDevices();
openWelcomeScreen();
clearUpdateAvailableUi();
setBootProgress(82, "Rendering chat");
updateNetworkAvailabilityUi();
peer = isNetworkOffline() ? null : createPeer();
setBootProgress(90, "Starting peer");
if (platformApi.supportsUpdateChecks) {
  checkForUpdates();
  setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL_MS);
  platformApi.onCheckForUpdates(() => checkForUpdates({ manual: true }));
}
platformApi.onDisconnect(() => cleanupRealtimeConnections());

window.addEventListener("offline", enterNetworkOfflineMode);
window.addEventListener("online", restoreNetworkConnection);

function syncTrayState() {
  platformApi.updateTrayState({
    peerId: callState.peerId || (peer && peer.id) || null,
    isMuted: Boolean(callState.muted),
    isDeafened: Boolean(callState.deafened),
    status: isNetworkOffline()
      ? "offline"
      : appConfig.appSettings?.presenceStatus || "online",
    theme: appConfig.appSettings?.theme || "light",
    autostart: Boolean(appConfig.appSettings?.autostart),
    closeToTray: Boolean(appConfig.appSettings?.closeToTray),
    debugOfflineMode,
    debugSimulateUpdate,
  });
}

setInterval(syncTrayState, 1500);

platformApi.onTrayAction(({ action, value }) => {
  if (action === "toggle-mute") {
    setCallMuted(!callState.muted);
  } else if (action === "toggle-deafen") {
    setCallDeafened(!callState.deafened);
  } else if (action === "set-status") {
    setPresenceStatus(value, { persist: true });
  } else if (action === "set-debug-simulate-update") {
    setDebugSimulateUpdate(value);
  } else if (action === "set-debug-offline-mode") {
    setDebugOfflineMode(value);
  } else if (action === "set-debug-boot-simulation") {
    setBootSimulation(value);
  } else if (action === "toggle-theme") {
    appConfig.appSettings.theme = appConfig.appSettings.theme === "light" ? "dark" : "light";
    renderAppSettings();
    saveAppConfig();
  } else if (action === "toggle-autostart") {
    appConfig.appSettings.autostart = !appConfig.appSettings.autostart;
    renderAppSettings();
    saveAppConfig();
  } else if (action === "toggle-close-to-tray") {
    appConfig.appSettings.closeToTray = !appConfig.appSettings.closeToTray;
    renderAppSettings();
    saveAppConfig();
  }
  syncTrayState();
});

async function finishBootScreen() {
  await waitForVisualReady();
  if (debugBootSimulation) return;
  setBootProgress(100, "Ready");

  requestAnimationFrame(() => {
    if (debugBootSimulation) return;
    document.body.classList.add("app-boot-finish");

    window.setTimeout(() => {
      if (debugBootSimulation) return;
      document.body.classList.remove("app-loading", "app-boot-finish");
    }, 280);
  });
}

finishBootScreen();

// Mobile integrations
platformApi.initMobile();
platformApi.onBackButton(() => {
  if (!welcomeScreen.classList.contains("hidden")) {
    if (currentWelcomeStep > 0) {
      welcomeBack.click();
    }
    return;
  }
  if (!appDialog.classList.contains("hidden")) {
    appDialogCancel.click();
    return;
  }
  if (
    callState.status === "incoming" &&
    !incomingCallScreen.classList.contains("hidden")
  ) {
    screenCallIgnore.click();
    return;
  }
  if (!streamModal.classList.contains("hidden")) {
    closeStreamSetup();
    return;
  }
  if (!updateModal.classList.contains("hidden")) {
    if (!availableUpdate?.mandatory) {
      updateModal.classList.add("hidden");
    }
    return;
  }
  if (!settingsModal.classList.contains("hidden")) {
    settingsClose.click();
    return;
  }

  const openMenu = [
    appMenu,
    contactMenu,
    messageMenu,
    participantMenu,
    streamMenu,
  ].some((menu) => !menu.classList.contains("hidden"));
  if (openMenu) {
    closeAppMenu();
    closeContactMenu();
    closeMessageMenu();
    closeParticipantMenu();
    closeStreamMenu();
    return;
  }
  if (streamFullscreenTarget) {
    setStreamFullscreenTarget("");
    return;
  }
  if (document.body.dataset.mobileTab !== "contacts") {
    setMobileTab("contacts");
    return;
  }
  platformApi.minimizeApp();
});

let lastBackgroundConnectionCount = -1;
async function syncBackgroundMode() {
  if (!platformApi.isAndroid) {
    return;
  }
  const activeCount = Array.from(connections.values()).filter(c => c?.open).length;
  if (activeCount === lastBackgroundConnectionCount) {
    return;
  }
  lastBackgroundConnectionCount = activeCount;
  if (activeCount > 0) {
    await platformApi.enableBackgroundMode(activeCount);
  } else {
    await platformApi.disableBackgroundMode();
  }
}
if (platformApi.isAndroid) {
  syncBackgroundMode();
  setInterval(syncBackgroundMode, 3000);
}

window.addEventListener("aero:open-chat", (e) => {
  if (e.detail && e.detail.peerId) {
    if (activePeerId !== e.detail.peerId) {
      setActiveChat(e.detail.peerId);
    }
  }
});

// Theme-aware tooltips for controls that are represented only by an icon.
const tooltipEl = document.createElement("div");
tooltipEl.className = "shadcn-tooltip hidden";
tooltipEl.setAttribute("role", "tooltip");
document.body.appendChild(tooltipEl);

let tooltipTimeout;
let activeTooltipTarget = null;
let lastTooltipPointer = null;
const tooltipTargetSelector = [
  ".titlebar-actions button[aria-label]",
  ".window-controls button[aria-label]:not(.header-update-button)",
  "button.icon-button[aria-label]",
  "button.icon-only-button[aria-label]",
  "button.status-retry[aria-label]",
  "button.contact-menu-button[aria-label]",
  "button.contact-remove[aria-label]",
  "button.stream-close-button[aria-label]",
  "button.stream-fullscreen-button[aria-label]",
].join(",");

function getTooltipTarget(element) {
  return element instanceof Element
    ? element.closest(tooltipTargetSelector)
    : null;
}

function prepareTooltipTarget(target) {
  if (!target) return "";
  const label = target.getAttribute("aria-label") || target.title || "";
  if (!label) return "";
  target.dataset.tooltip = label;
  target.removeAttribute("title");
  return label;
}

function positionTooltipAtPointer(pointer) {
  const tooltipRect = tooltipEl.getBoundingClientRect();
  let top = pointer.y + 16;
  let left = pointer.x + 12;

  if (top + tooltipRect.height > window.innerHeight - 8) {
    top = pointer.y - tooltipRect.height - 16;
  }
  if (left + tooltipRect.width > window.innerWidth - 8) {
    left = pointer.x - tooltipRect.width - 12;
  }

  top = Math.min(
    Math.max(8, top),
    Math.max(8, window.innerHeight - tooltipRect.height - 8),
  );
  left = Math.min(
    Math.max(8, left),
    Math.max(8, window.innerWidth - tooltipRect.width - 8),
  );

  tooltipEl.style.top = `${top}px`;
  tooltipEl.style.left = `${left}px`;
}

function positionTooltipNearTarget(target) {
  const rect = target.getBoundingClientRect();
  const tooltipRect = tooltipEl.getBoundingClientRect();
  let top = rect.top - tooltipRect.height - 7;
  let left = rect.left + rect.width / 2 - tooltipRect.width / 2;

  if (top < 8) top = rect.bottom + 7;
  left = Math.min(
    Math.max(8, left),
    Math.max(8, window.innerWidth - tooltipRect.width - 8),
  );

  tooltipEl.style.top = `${top}px`;
  tooltipEl.style.left = `${left}px`;
}

function showTooltip(target, pointer = null) {
  const label = prepareTooltipTarget(target);
  if (!label || target.disabled || target.classList.contains("hidden")) return;

  activeTooltipTarget = target;
  tooltipEl.textContent = label;
  tooltipEl.classList.remove("hidden");

  if (pointer) {
    positionTooltipAtPointer(pointer);
  } else {
    positionTooltipNearTarget(target);
  }
}

document.querySelectorAll(tooltipTargetSelector).forEach(prepareTooltipTarget);

document.addEventListener("mouseover", (event) => {
  const tooltipTarget = getTooltipTarget(event.target);
  if (!tooltipTarget) {
    hideTooltip();
    return;
  }

  lastTooltipPointer = { x: event.clientX, y: event.clientY };
  clearTimeout(tooltipTimeout);
  tooltipTimeout = setTimeout(
    () => showTooltip(tooltipTarget, lastTooltipPointer),
    350,
  );
});

document.addEventListener("mousemove", (event) => {
  const tooltipTarget = getTooltipTarget(event.target);
  if (!tooltipTarget) return;

  lastTooltipPointer = { x: event.clientX, y: event.clientY };
  if (activeTooltipTarget === tooltipTarget && !tooltipEl.classList.contains("hidden")) {
    positionTooltipAtPointer(lastTooltipPointer);
  }
});

document.addEventListener("mouseout", (event) => {
  const target = getTooltipTarget(event.target);
  if (target && !target.contains(event.relatedTarget)) hideTooltip();
});

document.addEventListener("focusin", (event) => {
  const target = getTooltipTarget(event.target);
  if (target) showTooltip(target);
});

document.addEventListener("focusout", (event) => {
  const target = getTooltipTarget(event.target);
  if (target && !target.contains(event.relatedTarget)) hideTooltip();
});

document.addEventListener("click", () => {
  hideTooltip();
});

window.addEventListener("resize", hideTooltip);
window.addEventListener("scroll", hideTooltip, true);

function hideTooltip() {
  clearTimeout(tooltipTimeout);
  activeTooltipTarget = null;
  tooltipEl.classList.add("hidden");
}
