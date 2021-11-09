import React, { useEffect, useRef, useState, useCallback } from 'react';
import './ad-mask.scss';
import logger from '../../logger';
import constants from '../../constants.json';
import { sendToContentScript } from '../../utils';
import AdMaskPortal from './AdMaskPortal';
import Box from '@mui/material/Box';

const InjectedApp = (): JSX.Element => {
  logger.log('[InjectedApp] init');
  let findContainerCount = 0;
  const [consoleState, setConsoleState] = useState(false);
  const handleConsoleStateChange = useCallback(event => {
    const checked = (event as CustomEvent).detail;
    setConsoleState(checked);
  }, [])
  useEffect(() => {
    document.addEventListener(constants.CONSOLE_TOGGLE, handleConsoleStateChange);
    return () => {
      document.removeEventListener(constants.CONSOLE_TOGGLE, handleConsoleStateChange);
    }
  }, []);
  sendToContentScript(constants.EVENTS.REQUEST_CONSOLE_STATE);

  const [masks, setMasks] = useState<IMaskInputData[]>([]);
  const handleNewMasks = useCallback(event => {
    const customEvent = (event as CustomEvent);
    const newMasks = customEvent.detail || [];
    setMasks(newMasks);
  }, []);
  useEffect(() => {
    document.addEventListener(constants.SAVE_MASKS, handleNewMasks);
    return () => {
      document.removeEventListener(constants.SAVE_MASKS, handleNewMasks);
    }
  }, []);

  const findContainerElement = (id: string) => {
    const container = document.getElementById(id);
    const elementsWithIdSubstring = document.querySelectorAll(`[id*="${id}"]`);
    if (container) {
      return container;
    }
    if (elementsWithIdSubstring.length > 0) {
      return elementsWithIdSubstring[0];
    }
    if (findContainerCount > 10) {
      logger.log(`[InjectedApp] Could not find container element with id ${id}. Retry #${findContainerCount}/10`);
      requestIdleCallback(() => {
        findContainerElement(id);
        findContainerCount += 1;
      });
    }
    return null;
  }

  return (
    <Box>
      {masks.map((mask, index) => {
        return <AdMaskPortal key={index} container={findContainerElement(mask.elementId) as HTMLDivElement} mask={mask} consoleState={consoleState} />
      })}
    </Box>
  );
};

interface IMaskInputData {
  elementId: string;
  creativeRenderTime: number;
  winningBidder: string;
  winningCPM: number;
  currency: string;
  timeToRespond: number;
}

export default InjectedApp;
