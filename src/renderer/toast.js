const container = document.getElementById("toast-container");

function getAvatarUrl(peerId, cacheBuster) {
  if (!peerId) return null;
  return `https://aero.zorblock.de/account/pfp/${peerId}.webp?t=${cacheBuster}`;
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
        const remaining = document.querySelectorAll('.toast').length;
        if (remaining === 0) {
          window.aeroChatNotification.updateToastHeight(0);
        } else {
          window.aeroChatNotification.updateToastHeight(document.body.scrollHeight + 30);
        }
      }, 50);
    }, 300);
  }
}

function showToast(details) {
  const { id, title, body, kind, peerId, accountUserId, callId, theme, avatarCacheBuster } = details;

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

    let html = `<div class="toast-header">`;
    
    // Add avatar if accountUserId is present
    if (accountUserId) {
      html += `<img class="toast-avatar" id="avatar-${id}" src="https://aero.zorblock.de/account/pfp/${accountUserId}.webp?t=${avatarCacheBuster}">`;
    }
    
    html += `<div class="toast-content">
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
    
    // Add error handler for avatar to hide it if broken (bypassing CSP inline issues)
    if (accountUserId) {
      const avatarImg = toastEl.querySelector(`#avatar-${id}`);
      if (avatarImg) {
        avatarImg.onerror = () => {
          avatarImg.style.display = 'none';
        };
      }
    }

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
      if (e.target.tagName === "BUTTON" || e.target.closest('button')) return; // Let button handlers fire
      
      window.aeroChatNotification.action({ 
        type: 'open', 
        openWindow: true, 
        id, 
        kind, 
        peerId, 
        callId 
      });
      window.aeroChatNotification.close(id);
    });

    container.appendChild(toastEl);

    // Button event listeners
    if (kind === "call") {
      toastEl.querySelector(`#btn-accept-${id}`).addEventListener("click", (e) => {
        e.stopPropagation();
        window.aeroChatNotification.action({ 
          type: 'accept-call', 
          openWindow: true, 
          id, 
          kind, 
          peerId, 
          callId 
        });
        window.aeroChatNotification.close(id);
      });
      
      toastEl.querySelector(`#btn-decline-${id}`).addEventListener("click", (e) => {
        e.stopPropagation();
        window.aeroChatNotification.action({ 
          type: 'decline-call', 
          id, 
          kind, 
          peerId, 
          callId 
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
    window.aeroChatNotification.updateToastHeight(document.body.scrollHeight + 30);
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
