import React from 'react';
import { createRoot } from 'react-dom/client';
import InjectedApp from '../App/InjectedApp';
import { googleAdManager } from './googleAdManager';
import { addEventListenersForPrebid } from './prebid';
import { iabTcf } from './tcf';
import { initProfessorPrebidMcpBridge } from './mcpBridge';
import { detectIframe, generateUniqueId } from '../Shared/utils';
import { MCP_BRIDGE_ENABLE } from '../Shared/constants';

const frameId = detectIframe() ? `${window.location.href}-${generateUniqueId()}` : 'top-window';
googleAdManager.init();
addEventListenersForPrebid(frameId);
iabTcf.init();
document.addEventListener(MCP_BRIDGE_ENABLE, () => initProfessorPrebidMcpBridge(), { once: true });

const injectApp = () => {
  if (document.body) {
    const root = document.createElement('div');
    root.id = 'professor_prebid-root';
    root.style.position = 'fixed';
    root.style.top = '0';
    root.style.left = '0';
    root.style.width = '0';
    root.style.height = '0';
    root.style.overflow = 'visible';
    root.style.pointerEvents = 'none';
    root.style.zIndex = '9999999';
    document.body.appendChild(root);
    const container = document.getElementById(root.id);
    if (container) {
      const root = createRoot(container);
      root.render(<InjectedApp />);
    }
  } else {
    if (requestIdleCallback && typeof requestIdleCallback === 'function') {
      requestIdleCallback(injectApp);
    }
  }
};
injectApp();
