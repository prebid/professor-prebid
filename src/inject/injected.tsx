/**
  This script is injected into the original page and is the ONLY
  way to gain access to the JS context of the page (namely pbjs)
  The only way for an injected script to message to the content.js
  script is via window.postMessage() 
 */

import React from 'react';
import ReactDOM from 'react-dom';
import logger from '../logger';
import InjectedApp from './InjectedApp';
import { googleAdManager } from './scripts/googleAdManager';
import { preBid } from './scripts/prebid';
import { iabTcf } from './scripts/tcf'
declare global {
  interface Window {
    googletag: any;
    _pbjsGlobals: any;
    PREBID_TIMEOUT: any;
    __cmp: any;
    __tcfapi: any;
  }
}
class Injected {
  init() {
    this.checkDependencies();
  }

  // make sure prebid/gpt exist in page before trying to run
  checkDependencies() {
    logger.log('[Injected] checking for prebid & gpt');
    const now = Date.now();
    let hasPrebid = false;
    let hasGPT = false;

    const interval = setInterval(() => {
      const globalPbjs = this.isPrebidInPage();
      if (!hasPrebid && globalPbjs) {
        logger.log('[Injected] prebid found');
        hasPrebid = true;
        preBid.init(globalPbjs);
      }
      
      if (!hasGPT && hasPrebid && this.isGPTInPage()) {
        logger.log('[Injected] gpt found');
        hasGPT = true;
        googleAdManager.init();
      }
      
      if (hasPrebid && hasGPT) {
        clearInterval(interval);
      }
      
      if (this.isTCFInpage()){
        iabTcf.init();
      }
    }, 50);

    setTimeout(() => {
      clearInterval(interval);
    }, 8000);
  }

  isPrebidInPage() {
    const pbjsGlobals = window._pbjsGlobals;
    if (pbjsGlobals && pbjsGlobals.length > 0) {
      const pbjsGlobal: any = window[pbjsGlobals[0]];

      const libLoaded = pbjsGlobal.libLoaded;
      if (libLoaded) {
        return pbjsGlobal;
      }
    }
  }

  isGPTInPage() {
    return window.googletag && window.googletag.pubadsReady && window.googletag.apiReady;
  }

  isTCFInpage() {
    return window.__cmp || window.__tcfapi
  }
}

const injected = new Injected();
injected.init();

const root = document.createElement('div');
root.id = 'professor_prebid-root';
document.body.appendChild(root);
ReactDOM.render(<InjectedApp />, document.getElementById(root.id));
