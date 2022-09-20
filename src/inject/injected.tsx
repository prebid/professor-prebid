/**
  This script is injected into the original page and is the ONLY
  way to gain access to the JS context of the page (namely pbjs)
  The only way for an injected script to message to the content.js
  script is via window.postMessage() 
 */

import React from 'react';
import ReactDOM from 'react-dom';
import InjectedApp from './app/InjectedApp';
import { googleAdManager } from './scripts/googleAdManager';
import { addEventListenersForPrebid } from './scripts/prebid';
import { iabTcf } from './scripts/tcf';

googleAdManager.init();
addEventListenersForPrebid();
iabTcf.init();

const injectApp = () => {
  if (document.body) {
    const root = document.createElement('div');
    root.id = 'professor_prebid-root';
    document.body.appendChild(root);
    ReactDOM.render(<InjectedApp />, document.getElementById(root.id));
  } else {
    if (requestIdleCallback && typeof requestIdleCallback === 'function') {
      requestIdleCallback(injectApp);
    }
  }
};
injectApp();
