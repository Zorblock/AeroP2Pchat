const container = document.getElementById("toast-container");

function createToastAvatar(label, id, config) {
  const avatar = document.createElement("div");
  avatar.className = "toast-avatar";
  const profile = normalizeAvatarConfig(config);
  const seed = createAvatarSeed(id);
  const hue = Math.floor(seed() * 360);
  const accentHue = (hue + 28 + Math.floor(seed() * 56)) % 360;
  const angle = Math.floor(seed() * 360);
  const base = profile.template === "unique" ? `hsl(${hue} 68% 42%)` : profile.color;
  const accent = profile.template === "unique" ? `hsl(${accentHue} 72% 56%)` : `hsl(${(hue + 38) % 360} 72% 56%)`;
  avatar.style.background =
    profile.template === "solid"
      ? base
      : profile.template === "rings"
        ? `radial-gradient(circle at 30% 25%, ${accent} 0 16%, transparent 17%), radial-gradient(circle at 70% 72%, ${accent} 0 23%, ${base} 24% 100%)`
        : `linear-gradient(${angle}deg, ${base}, ${accent})`;
  avatar.textContent = (label || id || "?").charAt(0).toUpperCase();
  return avatar;
}

function normalizeAvatarConfig(value) {
  const templates = new Set(["unique", "solid", "gradient", "rings"]);
  return {
    template: templates.has(value?.template) ? value.template : "unique",
    color: /^#[a-f0-9]{6}$/i.test(String(value?.color || ""))
      ? String(value.color).toLowerCase()
      : "#4f46e5",
  };
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

// Map of active toasts to their timeout IDs
const activeToasts = new Map();

window.aeroChatNotification.onShowToast((details) => {
  showToast(details);
});

window.aeroChatNotification.onCloseToast((id) => {
  closeToast(id);
});

function closeToast(id) {
  const toastEl = document.getElementById(`toast-${id}`);
  if (toastEl) {
    toastEl.classList.add("fade-out");
    setTimeout(() => {
      toastEl.remove();
      activeToasts.delete(id);

      // Update height after removal
      setTimeout(() => {
        const remaining = document.querySelectorAll(".toast").length;
        if (remaining === 0) {
          window.aeroChatNotification.updateToastHeight(0);
        } else {
          window.aeroChatNotification.updateToastHeight(
            document.body.scrollHeight + 30,
          );
        }
      }, 50);
    }, 300);
  }
}

function showToast(details) {
  const {
    id,
    title,
    body,
    kind,
    peerId,
    callId,
    theme,
    avatar,
  } = details;

  // Apply theme
  document.body.className = theme === "light" ? "light-theme" : "";

  // Enforce max 1 toast at a time: close all currently active toasts instantly without animation
  // This prevents the window from temporarily expanding to fit 2 toasts, which causes a visual jump.
  for (const [activeId, timeoutId] of activeToasts.entries()) {
    clearTimeout(timeoutId);
    const oldToast = document.getElementById(`toast-${activeId}`);
    if (oldToast) oldToast.remove();
    activeToasts.delete(activeId);
  }

  // Clear existing if any (fallback, should be handled by loop above)
  if (activeToasts.has(id)) {
    clearTimeout(activeToasts.get(id));
  } else {
    // Create new toast element
    const toastEl = document.createElement("div");
    toastEl.className = "toast";
    toastEl.id = `toast-${id}`;

    let html = `<div class="toast-header">
      <div class="toast-content">
        <h4 class="toast-title">${escapeHtml(title)}</h4>
        <p class="toast-body">${escapeHtml(body)}</p>
      </div>
      <button class="toast-close-btn" id="btn-close-${id}" aria-label="Close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>`;

    // Actions for calls
    if (kind === "call") {
      html += `<div class="toast-actions">
        <button class="toast-button primary" id="btn-accept-${id}">Accept</button>
        <button class="toast-button" id="btn-decline-${id}">Decline</button>
      </div>`;
    }

    toastEl.innerHTML = html;
    toastEl.querySelector(".toast-header")?.prepend(createToastAvatar(title, peerId, avatar));

    // Close button logic
    const closeBtn = toastEl.querySelector(`#btn-close-${id}`);
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        window.aeroChatNotification.close(id);
      });
    }

    // Click events
    toastEl.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON" || e.target.closest("button")) return; // Let button handlers fire

      window.aeroChatNotification.action({
        type: "open",
        openWindow: true,
        id,
        kind,
        peerId,
        callId,
      });
      window.aeroChatNotification.close(id);
    });

    container.appendChild(toastEl);

    // Button event listeners
    if (kind === "call") {
      toastEl
        .querySelector(`#btn-accept-${id}`)
        .addEventListener("click", (e) => {
          e.stopPropagation();
          window.aeroChatNotification.action({
            type: "accept-call",
            openWindow: true,
            id,
            kind,
            peerId,
            callId,
          });
          window.aeroChatNotification.close(id);
        });

      toastEl
        .querySelector(`#btn-decline-${id}`)
        .addEventListener("click", (e) => {
          e.stopPropagation();
          window.aeroChatNotification.action({
            type: "decline-call",
            id,
            kind,
            peerId,
            callId,
          });
          window.aeroChatNotification.close(id);
        });
    }
  }

  // Auto-close after 5s (if not a call)
  if (kind !== "call") {
    const timeout = setTimeout(() => {
      window.aeroChatNotification.close(id);
    }, 5000);
    activeToasts.set(id, timeout);
  }

  // Update window height
  setTimeout(() => {
    window.aeroChatNotification.updateToastHeight(
      document.body.scrollHeight + 30,
    );
  }, 50);
}

function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
