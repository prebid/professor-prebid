import logger from './logger';

export function sendToContentScript(type, payload = '') {
  const replacer = (key, value) => (typeof value === 'undefined' ? null : value);

  logger.log('postMessage ', type);
  window.postMessage({
    type,
    payload: JSON.stringify(payload, replacer),
  });
}

export function safelyParseJSON(data) {
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
