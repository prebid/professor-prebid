import React from 'react';
import ReactDOM from 'react-dom';
import InjectedApp from '../App/InjectedApp';
import { googleAdManager } from './googleAdManager';
import { addEventListenersForPrebid } from './prebid';
import { iabTcf } from './tcf';
import { detectIframe, generateUniqueId } from '../Shared/utils';

const frameId = detectIframe() ? `${window.location.href}-${generateUniqueId()}` : 'top-window';
googleAdManager.init();
addEventListenersForPrebid(frameId);
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
