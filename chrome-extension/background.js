chrome.action.onClicked.addListener(async () => {
  const appUrl = chrome.runtime.getURL("index.html");
  const [existingTab] = await chrome.tabs.query({ url: appUrl });

  if (existingTab?.id) {
    await chrome.tabs.update(existingTab.id, { active: true });
    if (existingTab.windowId) {
      await chrome.windows.update(existingTab.windowId, { focused: true });
    }
    return;
  }

  await chrome.tabs.create({ url: appUrl });
});
