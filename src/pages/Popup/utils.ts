export const getTabId = (): Promise<number> => {
  return new Promise((resolve) => {
    if (chrome?.devtools?.inspectedWindow?.tabId) {
      resolve(chrome.devtools.inspectedWindow.tabId);
    } else if (chrome?.tabs?.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0]?.id);
      });
    }
  });
};

export const firstDifferent = (input: string[], excludes: string[]): string => {
  const [first] = input.filter((item) => !excludes.includes(item));
  return first;
};
