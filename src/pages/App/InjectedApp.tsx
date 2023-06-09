import React, { useEffect, useState } from 'react';
import { EVENTS, CONSOLE_TOGGLE, SAVE_MASKS } from '../Shared/constants';
import { sendToContentScript } from '../Shared/utils';
import AdOverlayPortal from './components/AdOverlayPortal';
import { AdOverlayComponentProps } from './components/AdOverlayComponent';

import { IPrebidAuctionEndEventData, IPrebidBidWonEventData } from '../Content/scripts/prebid';

declare global {
  interface Window {
    [key: string]: any;
  }
}

const InjectedApp = (): JSX.Element => {
  const [consoleState, setConsoleState] = useState(false);
  const [masks, setMasks] = useState<AdOverlayComponentProps[]>([]);
  const [pbjsNameSpace, setPbjsNameSpace] = useState<string>();

  const handleConsoleStateChange = (event: Event) => {
    const checked = (event as CustomEvent).detail;
    setConsoleState(checked);
  };

  const handleNewMasks = (event: Event) => {
    const customEvent = event as CustomEvent;
    const pbjsNameSpace: string = customEvent.detail;
    if (pbjsNameSpace) {
      setPbjsNameSpace(pbjsNameSpace);
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
      setMasks(masks);
    }
  };

  useEffect(() => {
    sendToContentScript(EVENTS.REQUEST_CONSOLE_STATE, null);
    document.addEventListener(CONSOLE_TOGGLE, handleConsoleStateChange);
    document.addEventListener(SAVE_MASKS, handleNewMasks);
    return () => {
      document.removeEventListener(CONSOLE_TOGGLE, handleConsoleStateChange);
      document.removeEventListener(SAVE_MASKS, handleNewMasks);
    };
  }, []);

  return (
    <React.Fragment>
      {masks.map((mask, index) => {
        const container =
          document.getElementById(mask.elementId) || document.querySelector(`[id*="${mask.elementId}"]:not([id^=prpb-mask--container-])`);
        return <AdOverlayPortal key={index} mask={mask} consoleState={consoleState} container={container} pbjsNameSpace={pbjsNameSpace} />;
      })}
    </React.Fragment>
  );
};

export default InjectedApp;
