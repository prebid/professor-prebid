import React, { useEffect, useRef, useState, useCallback } from 'react';
import './ad-mask.scss';
import logger from '../../logger';
import constants from '../../constants.json';
import { sendToContentScript } from '../../utils';
import AdMaskPortal from './AdMaskPortal';
import Box from '@mui/material/Box';
import { IPrebidAuctionEndEventData, IPrebidBidWonEventData } from '../scripts/prebid';

declare global {
  interface Window {
    [key: string]: any;
  }
}

let findContainerCount = 0;
const findContainerElement = (id: string) => {
  const container = document.getElementById(id);
  const elementsWithIdSubstring = document.querySelectorAll(`[id*="${id}"]`);
  if (container) {
    logger.log(`[InjectedApp] Found container element with id ${id}.`);
    return container;
  }
  if (elementsWithIdSubstring.length > 0) {
    logger.log(`[InjectedApp] Found container element with id as substring in ${id}.`);
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
};

const InjectedApp = (): JSX.Element => {
  const [consoleState, setConsoleState] = useState(false);
  const [masks, setMasks] = useState<IMaskInputData[]>([]);

  const handleConsoleStateChange = (event: Event) => {
    const checked = (event as CustomEvent).detail;
    setConsoleState(checked);
  };

  const handleNewMasks = (event: Event) => {
    const customEvent = event as CustomEvent;
    const newMasks = prepareMasks(customEvent.detail) || [];
    logger.log('[InjectedApp] New masks prepared to set', newMasks);
    setMasks(newMasks);
  };

  const prepareMasks = (pbjsNameSpace: string) => {
    logger.log('[InjectedApp] prepareMasks', pbjsNameSpace);
    if (!pbjsNameSpace) return [];
    const lastAuctionEndEvent = ((window[pbjsNameSpace].getEvents() || []) as IPrebidAuctionEndEventData[])
      .filter((event) => event.eventType === 'auctionEnd')
      .sort((a, b) => (a.args.timestamp > b.args.timestamp ? 1 : -1))
      .pop();
    const masks =
      lastAuctionEndEvent?.args?.adUnits.map((slot) => {
        const slotsBidWonEvent = window[pbjsNameSpace]
          .getEvents()
          .find(
            (event: any) => event.eventType === 'bidWon' && (event as IPrebidBidWonEventData).args.adUnitCode === slot.code
          ) as IPrebidBidWonEventData;
        return {
          elementId: slot.code,
          creativeRenderTime: Date.now(), // TODO - get creative render time from prebid
          winningCPM: slotsBidWonEvent?.args.cpm ? Math.round(slotsBidWonEvent?.args.cpm * 100) / 100 : undefined,
          winningBidder: slotsBidWonEvent?.args.bidder || slotsBidWonEvent?.args.bidderCode,
          currency: slotsBidWonEvent?.args.currency,
          timeToRespond: slotsBidWonEvent?.args.timeToRespond,
        };
      });
    return masks;
  };

  useEffect(() => {
    sendToContentScript(constants.EVENTS.REQUEST_CONSOLE_STATE, null);
    document.addEventListener(constants.CONSOLE_TOGGLE, handleConsoleStateChange);
    document.addEventListener(constants.SAVE_MASKS, handleNewMasks);
    return () => {
      document.removeEventListener(constants.CONSOLE_TOGGLE, handleConsoleStateChange);
      document.removeEventListener(constants.SAVE_MASKS, handleNewMasks);
    };
  }, []);

  logger.log(`[InjectedApp] render:`, { consoleState, masks });
  return (
    <Box>
      {masks.map((mask, index) => {
        return (
          <AdMaskPortal key={index} container={findContainerElement(mask.elementId) as HTMLDivElement} mask={mask} consoleState={consoleState} />
        );
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
