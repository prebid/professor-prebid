import React from 'react';
import ReactDOM from 'react-dom';
import InjectedApp from './InjectedApp'; 
import { googleAdManager } from '../Content/scripts/googleAdManager';
import { addEventListenersForPrebid } from '../Content/scripts/prebid';
import { iabTcf } from '../Content/scripts/tcf';

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
