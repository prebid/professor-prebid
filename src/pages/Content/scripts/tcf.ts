import { sendToContentScript } from '../../../utils';
import constants from '../../../constants.json';

declare global {
  interface Window {
    __cmp: Function;
    __tcfapi: Function;
  }
}
class IabTcf {
  lastMessage: string;
  stopLoop: boolean = false;
  criteoVendorId: number = 91;
  init() {
    setTimeout(() => {
      this.stopLoop = true;
    }, 8000);
    this.loop();
  }

  loop() {
    if (this.isTCFInpage()) {
      this.sendDetailsToContentScript();
    } else if (!this.stopLoop) {
      setTimeout(() => this.loop(), 1000);
      // requestIdleCallback(() => this.loop());
    }
  }

  pingV1(callback: Function) {
    let cmpLoaded = false;
    try {
      window.__cmp('ping', null, (val: IPingReturn, success: boolean) => {
        if (success) {
          cmpLoaded = val.cmpLoaded;
        }
        if (typeof callback === 'function') {
          callback.apply(null, [cmpLoaded]);
        }
      });
    } catch (e) {
      if (typeof callback === 'function') {
        callback.apply(null, [cmpLoaded]);
      }
    }
  }

  getConsentDataV1(callback: Function) {
    let consentData: string = null;
    try {
      window.__cmp('getConsentData', null, (val: string, success: boolean) => {
        if (success) {
          consentData = val;
        }
        if (typeof callback === 'function') {
          callback.apply(null, [consentData]);
        }
      });
    } catch (e) {
      if (typeof callback == 'function') {
        callback.apply(null, [consentData]);
      }
    }
  }

  pingV2(callback: Function) {
    let pingReturn: IPingReturn = null;
    try {
      window.__tcfapi('ping', 2, (ping: IPingReturn) => {
        pingReturn = ping;
        if (typeof callback === 'function') {
          callback.apply(null, [pingReturn]);
        }
      });
    } catch (e) {
      if (typeof callback === 'function') {
        callback.apply(null, [pingReturn]);
      }
    }
  }

  getTCDataV2(callback: Function) {
    let tcData: string = null;
    try {
      window.__tcfapi('getTCData', 2, (data: string, success: boolean) => {
        if (success) {
          tcData = data;
        }
        if (typeof callback === 'function') {
          callback.apply(null, [tcData]);
        }
      });
    } catch (e) {
      if (typeof callback === 'function') {
        callback.apply(null, [tcData]);
      }
    }
  }

  isTCFInpage() {
    return window.__cmp || window.__tcfapi;
  }

  sendDetailsToContentScript() {
    if (typeof window.__cmp === 'function') {
      try {
        this.pingV1((cmpLoaded: boolean) => {
          this.getConsentDataV1((consentData: { gdprApplies: boolean; consentData: string }) => {
            const detail: ITcfDetails = {
              v1: {
                cmpLoaded: cmpLoaded,
                gdprApplies: consentData.gdprApplies,
                consentData: consentData.consentData,
              },
            };
            if (this.lastMessage !== JSON.stringify(detail)) {
              sendToContentScript(constants.EVENTS.SEND_TCF_DETAILS_TO_BACKGROUND, detail);
              this.lastMessage = JSON.stringify(detail);
            }
          });
        });
      } catch (e) {}
    }

    if (typeof window.__tcfapi === 'function') {
      try {
        this.pingV2((pingReturn: IPingReturn) => {
          this.getTCDataV2((tcData: { tcString: string }) => {
            const detail: ITcfDetails = {
              v2: {
                cmpLoaded: pingReturn.cmpLoaded,
                gdprApplies: pingReturn.gdprApplies,
                consentData: tcData.tcString,
              },
            };
            if (this.lastMessage !== JSON.stringify(detail)) {
              sendToContentScript(constants.EVENTS.SEND_TCF_DETAILS_TO_BACKGROUND, detail);
              this.lastMessage = JSON.stringify(detail);
            }
          });
        });
      } catch (e) {}
    }
  }
}

export const iabTcf = new IabTcf();

interface IPingReturn {
  gdprApplies?: boolean;
  cmpLoaded: boolean;
  cmpStatus: string;
  displayStatus: string;
  apiVersion: string | undefined;
  cmpVersion: number | undefined;
  cmpId: number;
  gvlVersion: number | undefined;
  tcfPolicyVersion: number | undefined;
}

export interface ITcfDetails {
  [key: string]: {
    cmpLoaded: boolean;
    gdprApplies: boolean;
    consentData: string;
  };
}
