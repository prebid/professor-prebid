import { safelyParseJSON } from '../../utils';
import constants from '../../constants.json';
import logger from '../../logger';
import React, { useCallback, useEffect, useState } from 'react';

class PopupHandler {
  handleDataFromContentScript(cb: any) {
    try {
      chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
        const { type, payload } = safelyParseJSON(request);
        if (type === constants.EVENTS.DATA_READY_FROM_CONTENT) {
          cb(payload);
        }
        if (type === constants.EVENTS.EVENT_SEND_AUCTION_DATA_TO_POPUP) {
          cb(payload);
        }
        sendResponse();
      });
    } catch (e) { }
  }

  onConsoleToggle(checked: boolean) {
    try {
      chrome.storage.local.set({ [constants.CONSOLE_TOGGLE]: checked }, () => {
        chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
          const tab = tabs[0];
          logger.log('[PopupHandler] Send onConsoleToggle', { tab }, { type: constants.CONSOLE_TOGGLE, consoleState: checked })
          chrome.tabs.sendMessage(tab.id, { type: constants.CONSOLE_TOGGLE, consoleState: checked });
        });
      });
    } catch (e) {
      logger.error('onConsoleToggle', e);
    }
  }

  getToggleStateFromStorage(cb: any) {
    try {
      chrome.storage.local.get(constants.CONSOLE_TOGGLE, (result) => {
        const checked = result ? result[constants.CONSOLE_TOGGLE] : false;

        cb(checked);
      });
    } catch (e) {
      logger.error('getToggleStateFromStorage', e);
    }
  }

  openDebugTab() {
    chrome.runtime.sendMessage({
      type: constants.EVENTS.OPEN_DATA_TAB,
      payload: '',
    });
  }
}

export const popupHandler = new PopupHandler();
