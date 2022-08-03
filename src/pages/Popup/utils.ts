export const getTabId = (): Promise<number> => {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]?.id);
    });
  });
};

export const firstDifferent = (input: string[], excludes: string[]): string => {
  const [first] = input.filter((item) => !excludes.includes(item));
  return first;
};
