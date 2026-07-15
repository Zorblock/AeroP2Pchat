const appPage = "index.html";

async function openApp() {
  const appUrl = chrome.runtime.getURL(appPage);
  const existingTabs = await chrome.tabs.query({ url: appUrl });
  const existing = existingTabs[0];

  if (existing?.id) {
    await chrome.tabs.update(existing.id, { active: true });
    if (existing.windowId) {
      await chrome.windows.update(existing.windowId, { focused: true });
    }
    return;
  }

  await chrome.tabs.create({ url: appUrl });
}

chrome.action.onClicked.addListener(() => {
  openApp().catch((error) => console.error("Could not open Aero P2P Chat", error));
});

chrome.runtime.onInstalled.addListener(() => {
  openApp().catch((error) => console.error("Could not open Aero P2P Chat", error));
});
