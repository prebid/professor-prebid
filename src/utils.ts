import logger from './logger';

export const sendToContentScript = (type: string, payload: any = '') => {
  const replacer = (key: any, value: any) => (typeof value === 'undefined' ? null : value);

  logger.log('[sendToContentScript] postMessage ', type);
  window.postMessage(
    {
      type,
      payload: JSON.stringify(payload, replacer),
    },
    undefined
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
  let min: number = null;
  let max: number = null;
  timestampArray.forEach((timestamp) => {
    if (timestamp < min || min === null) {
      min = timestamp;
    }
    if (timestamp > max || max === null) {
      max = timestamp;
    }
  });
  return { min, max };
};
