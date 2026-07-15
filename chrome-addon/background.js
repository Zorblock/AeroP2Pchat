const appPage = "index.html";

async function openApp() {
  const appUrl = chrome.runtime.getURL(appPage);
  const contexts = chrome.runtime.getContexts
    ? await chrome.runtime.getContexts({
        contextTypes: ["TAB"],
        documentUrls: [appUrl],
      })
    : [];
  const existing = contexts.find((context) => Number.isInteger(context.tabId));

  if (existing?.tabId) {
    await chrome.tabs.update(existing.tabId, { active: true });
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
