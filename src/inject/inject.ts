import logger from '../logger';
const inject = () => {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('/injected.bundle.js');
  script.id = 'professor prebid injected bundle';
  if (document.head || document.documentElement) {
    logger.log('[Inject]', script.src);
    (document.head || document.documentElement).appendChild(script);
    script.onload = () => {
      script.remove();
    };
  } else {
    requestIdleCallback(inject);
  }
};
inject();
