export const decycle = (obj: any) => {
  const cache = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      if (value['location']) {
        return;
      }
      if (cache.has(value)) {
        return;
      }

      cache.add(value);
    }
    return value;
  });
};

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

export const EventBus = {
  PREFIX: 'PROF_PREBID_MESSAGE_',

  emit: (type: string, payload: any): void => {
    const serializedPayload = JSON.parse(decycle(payload));
    const eventName = `${EventBus.PREFIX}${type}`;
    const customEvent = new CustomEvent(eventName, {
      detail: serializedPayload,
    });

    try {
      window.top.document.dispatchEvent(customEvent);
    } catch (e) {
      window.document.dispatchEvent(customEvent);
    }

    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      try {
        iframe.contentDocument?.dispatchEvent(new CustomEvent(eventName, { detail: serializedPayload }));
      } catch (e) {
        // Ignore cross-origin iframe DOM access errors
      }
    });
  },

  on: (type: string, callback: (payload: any) => void) => {
    const eventName = `${EventBus.PREFIX}${type}`;

    const listener = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail);
    };

    document.addEventListener(eventName, listener);

    return () => document.removeEventListener(eventName, listener);
  },

  onAny: (callback: (type: string, payload: any) => void, eventsToListen: string[]) => {
    const listeners: { eventName: string; listener: (event: Event) => void }[] = [];

    eventsToListen.forEach((type) => {
      const eventName = `${EventBus.PREFIX}${type}`;
      const listener = (event: Event) => {
        const customEvent = event as CustomEvent;
        callback(type, customEvent.detail);
      };
      document.addEventListener(eventName, listener);
      listeners.push({ eventName, listener });
    });

    return () => {
      listeners.forEach(({ eventName, listener }) => {
        document.removeEventListener(eventName, listener);
      });
    };
  },
};

export const createRangeArray = (start: number, end: number, step: number, offsetRight: number): number[] => {
  const arr1 = Array.from({ length: Math.ceil((end + offsetRight - start) / step) }, (_, x) => start + x * step);
  const endValueIndex = arr1.indexOf(end);
  if (endValueIndex === -1) {
    arr1.push(end);
  }
  return arr1.sort();
};

export const getMinAndMaxNumber = (timestampArray: number[]): { min: number; max: number } => {
  let min: number = 0;
  let max: number = 0;
  timestampArray.forEach((timestamp) => {
    if (timestamp < min || min === 0) {
      min = timestamp;
    }
    if (timestamp > max || max === 0) {
      max = timestamp;
    }
  });
  return { min, max };
};

export const conditionalPluralization = (input: Array<any>): string => (input?.length > 1 ? 's' : '');

export const reloadPage = async () => {
  const tabId = await getTabId();
  chrome.tabs.reload(tabId);
};

export const sendChromeTabsMessage = async (type: string, payload: object | string): Promise<void> => {
  const tabId = await getTabId();
  chrome.tabs.sendMessage(tabId, { type, payload });
};

export const detectIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

export const generateUniqueId = () => new Date().getTime() + '-' + Math.random().toString(36).substring(2, 11);

export const download = (input: object, filename: string) => {
  const dataStr = JSON.stringify(input, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const dataUri = URL.createObjectURL(blob);

  const exportFileDefaultName = `f${filename}-${new Date().toISOString().split('T')[0]}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  URL.revokeObjectURL(dataUri);
};

export const timeFromNow = (date: string | Date | number): string => {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.round((d.getTime() - now.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ];

  for (const { unit, seconds } of units) {
    if (Math.abs(diffInSeconds) >= seconds || unit === 'second') {
      return rtf.format(Math.round(diffInSeconds / seconds), unit);
    }
  }

  return '';
};
