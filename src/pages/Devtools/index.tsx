let windowObj: Window;
let tabId: number;
export const createPanel = () =>
  chrome.devtools?.panels.create('Professor Prebid', 'icon-34.png', 'panel.html', async (panel) => {
    tabId = chrome.devtools.inspectedWindow.tabId;
    panel.onShown.addListener(function tmp(panel_window) {
      panel.onShown.removeListener(tmp);
      windowObj = panel_window;
      windowObj.tabId = tabId;
    });
  });
createPanel();

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.tabId === tabId && details.frameId === 0) {
    windowObj?.location?.reload();
  }
});
