// inspired by https://github.com/GoogleChromeLabs/trust-safety-demo/blob/main/protected-audience/samples/devtools-extension/src/service-worker.js

export class Paapi {
  // What each connection from a devtools page is debugging.
  portToTargets = new Map();

  // Which devtools page cares about a particular tab or target. These are keyed
  // by just the respective ID.
  tabIdToPort = new Map();
  targetIdToPort = new Map();

  constructor() {
    chrome.runtime.onConnect.addListener(this.connectListener);
    chrome.debugger.onEvent.addListener(this.eventHandler);
  }

  eventHandler = (source: any, method: string, params: any) => {
    // This is useful for debugging things:
    // console.log(method + '/' + JSON.stringify(params) + ' /' + JSON.stringify(source));
    let port = null;
    if (source.tabId) {
      port = this.tabIdToPort.get(source.tabId);
    } else if (source.targetId) {
      port = this.targetIdToPort.get(source.targetId);
    }

    if (port) {
      // Forward the messages extension cares about.
      if (
        method === 'Storage.interestGroupAccessed' ||
        method === 'Storage.interestGroupAuctionEventOccurred' ||
        method === 'Storage.interestGroupAuctionNetworkRequestCreated' ||
        method === 'Network.requestWillBeSent' ||
        method === 'Network.loadingFinished' ||
        method === 'Network.loadingFailed' ||
        (method === 'Page.frameNavigated' && !params.frame.parentId)
      ) {
        port.postMessage({ method, params });
      }

      // Pay attention to frames.
      if (method === 'Target.attachedToTarget') {
        const targetId = params.targetInfo.targetId;
        const childDebuggee = { targetId: targetId };
        this.targetIdToPort.set(targetId, port);
        this.portToTargets.get(port).push(childDebuggee);
        chrome.debugger.attach(childDebuggee, '1.3', () => {
          // Child frames don't need setInterestGroupTracking since
          // interestGroupAccessed is global anyway.
          this.enableInterestGroupAuctionTracking(childDebuggee);
          this.enableNetworkEvents(childDebuggee);

          // In non-flat mode, we must send runIfWaitingForDebugger via
          // sendMessageToTarget for it to actually work.
          const message = {
            id: 0,
            method: 'Runtime.runIfWaitingForDebugger',
            params: {},
          };
          chrome.debugger.sendCommand(source, 'Target.sendMessageToTarget', {
            message: JSON.stringify(message),
            targetId: targetId,
          });
        });
      }

      if (method === 'Target.detachedFromTarget') {
        const targetId = params.targetId;
        const childDebuggee = { targetId: targetId };
        // If seems like the extension API doesn't detach on some iframes, so
        // try to be sure.
        chrome.debugger.detach(childDebuggee);
        this.targetIdToPort.delete(targetId);
        // This is pretty awful complexity-wise; it would be better to use a set,
        // but that would require encoding target down to a string key.
        const remainingTargets = this.portToTargets.get(port).filter((t: { targetId: string; tabId: string }) => {
          return t.tabId || t.targetId !== targetId;
        });
        this.portToTargets.set(port, remainingTargets);
      }
    }
  };

  enableInterestGroupTracking = (debuggee: any) => {
    // console.log({ debuggee });
    chrome.debugger.sendCommand(debuggee, 'Storage.setInterestGroupTracking', {
      enable: true,
    });
  };

  enableInterestGroupAuctionTracking = (debuggee: any) => {
    // console.log({ debuggee });
    chrome.debugger.sendCommand(debuggee, 'Storage.setInterestGroupAuctionTracking', { enable: true });
  };

  enableNetworkEvents = (debuggee: any) => {
    // console.log({ debuggee });
    chrome.debugger.sendCommand(debuggee, 'Network.enable', {});
  };

  enablePageEvents = (debuggee: any) => {
    // console.log({ debuggee });
    chrome.debugger.sendCommand(debuggee, 'Page.enable', {});
  };

  connectListener = (devtoolsPagePort: any) => {
    const onMessage = (message: any, sender: any) => {
      let debuggee = { tabId: message.tabId };
      this.connectToTab(devtoolsPagePort, debuggee);
    };

    devtoolsPagePort.onMessage.addListener(onMessage);
    devtoolsPagePort.onDisconnect.addListener(() => {
      this.disconnectFromTab(devtoolsPagePort, undefined);
      devtoolsPagePort.onMessage.removeListener(onMessage);
    });
  };

  connectToTab = (devtoolsPagePort: any, debuggee: any) => {
    this.portToTargets.set(devtoolsPagePort, [debuggee]);
    this.tabIdToPort.set(debuggee.tabId, devtoolsPagePort);
    chrome.debugger.attach(debuggee, '1.3', () => {
      // Pay attention to child frames, to enable auction events on them.
      // Using flatten: true here would simplify things, but sadly the
      // 'debugger' extension API doesn't appear to understand it.
      //
      // waitForDebuggerOnStart gives us a window to enable tracking before any
      // auctions run.
      chrome.debugger.sendCommand(debuggee, 'Target.setAutoAttach', {
        autoAttach: true,
        flatten: false,
        waitForDebuggerOnStart: true,
        filter: [{ type: 'iframe' }],
      });
      this.enableInterestGroupTracking(debuggee);
      this.enableInterestGroupAuctionTracking(debuggee);
      this.enableNetworkEvents(debuggee);
      this.enablePageEvents(debuggee);
    });
  };

  disconnectFromTab = (devtoolsPagePort: any, onMessage: any) => {
    const debuggees = this.portToTargets.get(devtoolsPagePort);
    for (const debuggee of debuggees) {
      chrome.debugger.detach(debuggee);
      if (debuggee.tabId) {
        this.tabIdToPort.delete(debuggee.tabId);
      } else {
        this.targetIdToPort.delete(debuggee.targetId);
      }
    }
    this.portToTargets.delete(devtoolsPagePort);
  };
}
