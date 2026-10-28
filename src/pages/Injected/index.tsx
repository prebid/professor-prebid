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
    if (document.getElementById('professor_prebid-root')) return;
    const container = document.createElement('div');
    container.id = 'professor_prebid-root';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '0';
    container.style.height = '0';
    container.style.overflow = 'visible';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999999';
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(<InjectedApp />);
  } else {
    if (requestIdleCallback && typeof requestIdleCallback === 'function') {
      requestIdleCallback(injectApp);
    }
  }
};
injectApp();
