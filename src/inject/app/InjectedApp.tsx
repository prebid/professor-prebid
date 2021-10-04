import React, { useEffect, useRef, useState } from 'react';
import './ad-mask.scss';
import logger from '../../logger';
import constants from '../../constants.json';
import { sendToContentScript } from '../../utils';
import { IPrebidDetails } from '../scripts/prebid';
import AdMaskPortal from './AdMaskPortal';

const InjectedApp = (): JSX.Element => {
  const [consoleState, setConsoleState] = useState(false);
  const [masks, setMasks] = useState<IMaskInputData[]>([]);

  logger.log('[InjectedApp] init', consoleState, masks)

  const addListeners = () => {
    // listen from content script
    document.addEventListener(constants.SAVE_MASKS, event => {
      const customEvent = (event as CustomEvent);
      const newMasks = customEvent.detail || [];
      newMasks.forEach((mask: any) => {
        setMasks((v) => [...v, mask]);
      })
    });

    // listen from content script
    document.addEventListener(constants.CONSOLE_TOGGLE, (event) => {
      const checked = (event as CustomEvent).detail;
      setConsoleState(checked);
    });

  }

  useEffect(() => {
    addListeners();
    // request initial console state
    sendToContentScript(constants.EVENTS.REQUEST_CONSOLE_STATE);
  }, []);

  return (
    <div>
      {masks.map((mask, index) =>
        <AdMaskPortal key={index} container={document.getElementById(mask.elementId)} mask={mask} consoleState={consoleState} />
      )}
    </div>
  );
};

interface IMaskInputData {
  elementId: string;
  creativeRenderTime: number;
  winningBidder: string;
  winningCPM: number;
  prebid: IPrebidDetails;
}

export default InjectedApp;
