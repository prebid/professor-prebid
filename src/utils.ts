import logger from './logger';

export const sendToContentScript = (type: string, payload: any) => {
  logger.log('[sendToContentScript] postMessage ', type);
  // work-around for
  // DOMException:xyz could not be cloned.
  // in window.postMessage
  payload = JSON.parse(JSON.stringify(payload));
  (window as any).top.postMessage(
    {
      type,
      payload,
    },
    '*'
  );
};

export const safelyParseJSON = (data: any): any => {
  if (typeof data === 'object') {
    return data;
  }

  try {
    return JSON.parse(data);
  } catch (e) {
    console.error(`safelyParseJSON failed with data `, data);
    return {};
  }
};

export const createRangeArray = (start: number, end: number, step: number): number[] => {
  return Array.from(Array.from(Array(Math.ceil((end - start) / step)).keys()), (x) => start + x * step);
};

export const getMinAndMaxNumber = (timestampArray: number[]) => {
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
