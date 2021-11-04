import React, { useEffect, useRef, useState, useCallback } from 'react';
import './ad-mask.scss';
import logger from '../../logger';
import constants from '../../constants.json';
import { sendToContentScript } from '../../utils';
import AdMaskPortal from './AdMaskPortal';
import Box from '@mui/material/Box';

const InjectedApp = (): JSX.Element => {
  logger.log('[InjectedApp] init');

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
  },[]);

  return (
    <Box>
      {masks.map((mask, index) =>
        <AdMaskPortal key={index} container={document.getElementById(mask.elementId)} mask={mask} consoleState={consoleState} />
      )}
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
