import React, { useEffect, useState } from 'react';
import logger from '../../logger';
import constants from '../../constants.json';
import { sendToContentScript } from '../../utils';
import AdOverlayPortal from './AdOverlayPortal';
import { AdOverlayComponentProps } from './AdOverlayComponent';

import { IPrebidAuctionEndEventData, IPrebidBidWonEventData } from '../scripts/prebid';

declare global {
  interface Window {
    [key: string]: any;
  }
}

const InjectedApp = (): JSX.Element => {
  const [consoleState, setConsoleState] = useState(false);
  const [masks, setMasks] = useState<AdOverlayComponentProps[]>([]);

  const handleConsoleStateChange = (event: Event) => {
    const checked = (event as CustomEvent).detail;
    setConsoleState(checked);
  };

  const handleNewMasks = (event: Event) => {
    const customEvent = event as CustomEvent;
    const pbjsNameSpace: string = customEvent.detail;
    if (pbjsNameSpace) {
      const pbsjsEvents = (window[pbjsNameSpace]?.getEvents ? window[pbjsNameSpace].getEvents() : []) as unknown[];
      const auctionEndEvents = (pbsjsEvents as IPrebidAuctionEndEventData[]).filter((event) => event.eventType === 'auctionEnd');
      const allAdunitCodes = Array.from(
        new Set(
          auctionEndEvents.reduce((acc, auctionEndEvent) => {
            return acc.concat(auctionEndEvent.args.adUnitCodes);
          }, [] as string[])
        )
      );
      const masks = allAdunitCodes
        .filter(
          (adUnitCode) => document.getElementById(adUnitCode) || document.querySelector(`[id*="${adUnitCode}"]:not([id^=prpb-mask--container-])`)
        )
        .map((adUnitCode) => {
          const slotsBidWonEvent = (pbsjsEvents as IPrebidBidWonEventData[])
            .filter((event) => event.eventType === 'bidWon' && event.args.adUnitCode === adUnitCode)
            .sort((a, b) => (a.args.responseTimestamp < b.args.responseTimestamp ? 1 : -1))[0];

          return {
            elementId: adUnitCode,
            winningCPM: slotsBidWonEvent?.args.cpm ? Math.round(slotsBidWonEvent?.args.cpm * 100) / 100 : undefined,
            winningBidder: slotsBidWonEvent?.args.bidder || slotsBidWonEvent?.args.bidderCode,
            currency: slotsBidWonEvent?.args.currency,
            timeToRespond: slotsBidWonEvent?.args.timeToRespond,
          };
        });
      logger.log('[InjectedApp] New masks prepared to set', masks);
      setMasks(masks);
    }
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

  return (
    <React.Fragment>
      {masks.map((mask, index) => {
        const container =
          document.getElementById(mask.elementId) || document.querySelector(`[id*="${mask.elementId}"]:not([id^=prpb-mask--container-])`);
        return <AdOverlayPortal key={index} mask={mask} consoleState={consoleState} container={container} />;
      })}
    </React.Fragment>
  );
};

export default InjectedApp;
