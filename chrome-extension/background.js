chrome.action.onClicked.addListener(() => {
  const appUrl = chrome.runtime.getURL("index.html");
  // Creating a tab does not require the broad "tabs" permission. This is
  // intentionally simpler than inspecting or focusing an existing browser tab.
  return chrome.tabs.create({ url: appUrl });
});
