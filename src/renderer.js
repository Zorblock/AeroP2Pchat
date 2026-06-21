import Peer, { util } from "peerjs";
import "@fortawesome/fontawesome-free/css/all.min.css";
import appLogo from "../assets/app.png";
import packageInfo from "../package.json";
import "./styles.css";

const brandLogo = document.querySelector("#brand-logo");
const titlebarLogo = document.querySelector("#titlebar-logo");
const titlebarSubtitle = document.querySelector("#titlebar-subtitle");
const windowMinimize = document.querySelector("#window-minimize");
const windowMaximize = document.querySelector("#window-maximize");
const windowClose = document.querySelector("#window-close");
const ownId = document.querySelector("#own-id");
const copyId = document.querySelector("#copy-id");
const connectForm = document.querySelector("#connect-form");
const remoteIdInput = document.querySelector("#remote-id");
const statusDot = document.querySelector("#status-dot");
const statusText = document.querySelector("#status-text");
const peerList = document.querySelector("#peer-list");
const chatTitle = document.querySelector("#chat-title");
const clearChat = document.querySelector("#clear-chat");
const disconnectChat = document.querySelector("#disconnect-chat");
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
const settingsButton = document.querySelector("#settings-button");
const settingsModal = document.querySelector("#settings-modal");
const settingsClose = document.querySelector("#settings-close");
const nicknameInput = document.querySelector("#nickname-input");
const blockedList = document.querySelector("#blocked-list");
const contactMenu = document.querySelector("#contact-menu");
const menuTrust = document.querySelector("#menu-trust");
const menuPin = document.querySelector("#menu-pin");
const menuNickname = document.querySelector("#menu-nickname");
const menuBlock = document.querySelector("#menu-block");

const connections = new Map();
const pendingConnections = new Map();
const CHAT_LABEL = "aero-p2p-chat";
const PROTOCOL_VERSION = 1;
const IDENTITY_STORAGE_KEY = "aero-p2p-chat.identity.v1";
const CONTACTS_STORAGE_KEY = "aero-p2p-chat.contacts.v1";
const MAX_MESSAGE_LENGTH = 4000;
const HIGH_BUFFER_SIZE = 25;
let activePeerId = null;
let myPeerId = "";
let peer = null;
let availableUpdate = null;
let contacts = [];
let contextContactId = "";

brandLogo.src = appLogo;
titlebarLogo.src = appLogo;

const currentVersion = packageInfo.version;
const latestReleaseUrl = "https://github.com/jonasgrimmde/AeroP2Pchat/releases/latest";
const latestManifestUrl = "https://github.com/jonasgrimmde/AeroP2Pchat/releases/latest/download/latest.yml";
const defaultWindowsSetupUrl = "https://github.com/jonasgrimmde/AeroP2Pchat/releases/latest/download/Aero-P2P-Chat-Windows-Setup.exe";
const linuxInstallCommand = "curl -fsSL https://raw.githubusercontent.com/jonasgrimmde/AeroP2Pchat/refs/heads/main/install.sh | sh -s -- update";
const platform = window.aeroChat?.platform ?? "browser";
const peerConnectionConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ],
  iceCandidatePoolSize: 2
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
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `aero-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function loadIdentity() {
  if (appConfig.identity?.id && /^aero-[a-f0-9]{32}$/.test(appConfig.identity.id)) {
    appConfig.identity.nickname = sanitizeNickname(appConfig.identity.nickname);
    return appConfig.identity;
  }

  const identity = {
    id: createIdentityId(),
    nickname: "",
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
    if (!appConfig.identity && storedIdentity?.id && /^aero-[a-f0-9]{32}$/.test(storedIdentity.id)) {
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
migrateLocalStorageConfig();
const identity = loadIdentity();

ownId.textContent = identity.id;
remoteIdInput.placeholder = "friend-aero-id";
nicknameInput.value = identity.nickname || "";

function isValidAeroId(value) {
  return /^aero-[a-f0-9]{32}$/.test(String(value || "").trim());
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
      return;
    }

    availableUpdate = {
      version: latestVersion,
      windowsUrl: manifest.windowsUrl || defaultWindowsSetupUrl
    };

    updateTitle.textContent = "Update available";
    updateText.textContent = `Version ${latestVersion} is ready. You are using ${currentVersion}.`;
    updateButton.textContent = platform === "win32" ? "Install update" : "Show command";
    headerUpdateButton.classList.remove("hidden");
  } catch {
    headerUpdateButton.classList.add("hidden");
    updateCard.classList.add("hidden");
  }
}

function addSystemMessage(text) {
  const row = document.createElement("div");
  row.className = "message-row system";
  row.textContent = text;
  messages.append(row);
  messages.scrollTop = messages.scrollHeight;
}

function addChatMessage({ text, sender, peerId, time }) {
  const row = document.createElement("div");
  row.className = `message-row ${sender === "me" ? "mine" : "theirs"}`;

  const bubble = document.createElement("article");
  bubble.className = "bubble";

  const meta = document.createElement("span");
  meta.className = "bubble-meta";
  meta.textContent = `${sender === "me" ? "You" : peerId} · ${time ?? formatTime()}`;

  const body = document.createElement("p");
  body.textContent = text;

  bubble.append(meta, body);
  row.append(bubble);
  messages.append(row);
  messages.scrollTop = messages.scrollHeight;
}

function isSupportedDataChannel() {
  return Boolean(util.supports?.data && util.supports?.reliable);
}

function createChatMetadata() {
  return {
    app: "Aero P2P Chat",
    identityId: identity.id,
    nickname: identity.nickname || "",
    protocol: PROTOCOL_VERSION,
    version: currentVersion
  };
}

function getPeerLabel(peerId, conn) {
  const identityId = conn?.metadata?.identityId || peerId;
  return findContact(identityId)?.label || sanitizeNickname(conn?.metadata?.nickname) || identityId;
}

function getPeerIdentityId(peerId, conn) {
  return conn?.metadata?.identityId || peerId;
}

function openContactMenu(event, id) {
  event.preventDefault();
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
    time: formatTime(),
    ...extra
  });
  return true;
}

function removePeer(peerId) {
  connections.delete(peerId);
  pendingConnections.delete(peerId);
  if (activePeerId === peerId) {
    activePeerId = connections.keys().next().value ?? null;
  }
}

function refreshPeers() {
  peerList.replaceChildren();

  if (connections.size === 0 && pendingConnections.size === 0) {
    if (contacts.length === 0) {
      const empty = document.createElement("span");
      empty.className = "empty-peer";
      empty.textContent = "No connection yet";
      peerList.append(empty);
    }
    chatTitle.textContent = "Ready to connect";
    messageInput.disabled = true;
    sendButton.disabled = true;
    disconnectChat.disabled = true;
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
    remove.textContent = "X";
    remove.title = "Remove contact";
    remove.addEventListener("click", () => {
      removeContact(contact.id);
    });
    row.addEventListener("contextmenu", (event) => {
      openContactMenu(event, contact.id);
    });

    row.append(name, remove);
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
    button.addEventListener("click", () => {
      activePeerId = peerId;
      refreshPeers();
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
    addSystemMessage(`Connection with ${peerLabel} accepted.`);
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
  addSystemMessage(`${peerLabel} accepted your request.`);
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
      addSystemMessage(`Connection with ${peerLabel()} accepted.`);
      refreshPeers();
      return;
    }

    if (connections.has(peerId)) {
      setStatus("online", `Connected to ${peerLabel()}`);
      refreshPeers();
    }
  });

  conn.on("data", (data) => {
    if (data?.type === "connection-request") {
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

    const message = normalizeMessage(data);
    if (!message || !connections.has(peerId)) {
      return;
    }

    addChatMessage({
      text: message.text,
      sender: "them",
      peerId,
      time: message.time
    });
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
  const peerIdentityId = getPeerIdentityId(peerId, conn);
  rememberRemoteIdentity(peerIdentityId, conn.metadata?.nickname);

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
  });

  nextPeer.on("connection", (conn) => {
    registerConnection(conn, { incoming: true });
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

  await navigator.clipboard.writeText(identity.id);
  setStatus("pending", "Aero ID copied.");
});

connectForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const remoteId = remoteIdInput.value.trim();
  if (!isValidAeroId(remoteId)) {
    setStatus("offline", "Please enter a valid Aero ID.");
    return;
  }

  pinContact(remoteId);
  connectToPeer(remoteId);
  remoteIdInput.value = "";
  refreshPeers();
});

messageForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = messageInput.value.trim();
  if (!text || !activePeerId) {
    return;
  }

  const conn = connections.get(activePeerId);
  if (!conn?.open) {
    setStatus("offline", "The active peer is not ready yet.");
    return;
  }

  if (conn.bufferSize > HIGH_BUFFER_SIZE) {
    setStatus("pending", "Waiting for the send buffer to drain...");
    return;
  }

  const payload = {
    type: "chat-message",
    protocol: PROTOCOL_VERSION,
    text: text.slice(0, MAX_MESSAGE_LENGTH),
    time: formatTime()
  };

  try {
    conn.send(payload);
  } catch (error) {
    setStatus("offline", `Send failed: ${error.message}`);
    return;
  }

  addChatMessage({
    text: payload.text,
    sender: "me",
    peerId: activePeerId,
    time: payload.time
  });
  messageInput.value = "";
  messageInput.focus();
});

clearChat.addEventListener("click", () => {
  messages.replaceChildren();
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

function openLinuxUpdateModal() {
  modalText.textContent = `Run this command to update Aero P2P Chat to version ${availableUpdate?.version ?? "latest"}.`;
  linuxCommand.textContent = linuxInstallCommand;
  updateModal.classList.remove("hidden");
}

async function installAvailableUpdate() {
  if (!availableUpdate) {
    window.open(latestReleaseUrl, "_blank", "noopener");
    return;
  }

  if (platform === "win32") {
    updateButton.disabled = true;
    headerUpdateButton.disabled = true;
    updateButton.textContent = "Installing...";
    headerUpdateButton.textContent = "Installing...";
    setStatus("pending", "Downloading update installer...");

    try {
      await window.aeroChat.installUpdate({
        url: availableUpdate.windowsUrl,
        version: availableUpdate.version
      });
      setStatus("pending", "Installing update. The app will restart.");
    } catch (error) {
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
  await navigator.clipboard.writeText(linuxInstallCommand);
  copyUpdateCommand.textContent = "Copied";
  setTimeout(() => {
    copyUpdateCommand.textContent = "Copy command";
  }, 1200);
});

settingsButton.addEventListener("click", () => {
  nicknameInput.value = identity.nickname || "";
  renderBlockedList();
  settingsModal.classList.remove("hidden");
});

settingsClose.addEventListener("click", () => {
  settingsModal.classList.add("hidden");
});

settingsModal.addEventListener("click", (event) => {
  if (event.target === settingsModal) {
    settingsModal.classList.add("hidden");
  }
});

nicknameInput.addEventListener("change", () => {
  identity.nickname = sanitizeNickname(nicknameInput.value);
  nicknameInput.value = identity.nickname;
  appConfig.identity = identity;
  saveAppConfig();
  setStatus("pending", identity.nickname ? `Nickname set to ${identity.nickname}.` : "Nickname cleared.");
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

  const contact = findContact(contextContactId);
  const nextNickname = window.prompt("Nickname", contact?.customLabel ? contact.label : "");
  if (nextNickname !== null) {
    setContactNickname(contextContactId, nextNickname);
    addSystemMessage(`${contextContactId} nickname ${sanitizeNickname(nextNickname) ? "saved" : "cleared"}.`);
  }
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

document.addEventListener("click", (event) => {
  if (!contactMenu.contains(event.target)) {
    closeContactMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeContactMenu();
    updateModal.classList.add("hidden");
    settingsModal.classList.add("hidden");
  }
});

window.addEventListener("beforeunload", () => {
  for (const conn of connections.values()) {
    conn.close();
  }
  for (const entry of pendingConnections.values()) {
    entry.conn.close();
  }
  peer?.destroy();
});

refreshPeers();
peer = createPeer();
checkForUpdates();
