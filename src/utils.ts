import logger from './logger';

export const sendToContentScript = (type: string, payload: any = '') => {
  const replacer = (key: any, value: any) => (typeof value === 'undefined' ? null : value);

  logger.log('[sendToContentScript] postMessage ', type);
  window.postMessage({
    type,
    payload: JSON.stringify(payload, replacer),
  }, undefined);
}

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
}
