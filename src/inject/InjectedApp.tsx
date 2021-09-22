import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import './ad-mask.scss';
import logger from '../logger';
import constants from '../constants.json';
import { sendToContentScript } from '../utils';
import { IPrebidBid } from './scripts/prebid';

const InjectedApp = (): JSX.Element => {
  const [consoleState, setConsoleState] = useState(false);
  const [masks, setMasks] = useState<IMaskInputData[]>([]);
  let lastMasksString: string;
  logger.log('[InjectedApp] init', consoleState, masks)
  useEffect(() => {
    // listen from content script
    document.addEventListener(constants.SAVE_MASKS, (event: any) => {
      const customEvent = (event as CustomEvent);
      const newMasks = customEvent.detail;
      if (lastMasksString !== JSON.stringify(newMasks)) {
        Array.isArray(newMasks) && newMasks.forEach((mask: any) => {
          setMasks((v) => [...v, mask]);
        })
      }

      lastMasksString = JSON.stringify(newMasks);
    });

    // listen from content script
    document.addEventListener(constants.CONSOLE_TOGGLE, (event) => {
      const checked = (event as CustomEvent).detail;
      setConsoleState(checked);
    });

    // request initial console state
    sendToContentScript(constants.EVENTS.REQUEST_CONSOLE_STATE);
  }, []);

  return (
    <div>
      {consoleState && masks.map((mask, index) => {
        const container = document.getElementById(mask.elementId);
        if (!container) {
          logger.log('[InjectedApp] failed to render mask on page, could not find element by elementId', mask);
          return null;
        }
        return <AdMaskPortal key={index} container={container} mask={mask} />;
      })}
    </div>
  );
};

const AdMaskPortal: React.FC<IAdMaskPortalProps> = ({ container, mask }) => {
  const el = useRef<HTMLDivElement>(createMaskContainerElement());

  useEffect(() => {
    if (container) {
      // delete old masks
      const elements = container.getElementsByClassName('prpb-mask__overlay');
      while (elements[0]) {
        elements[0].parentNode.removeChild(elements[0]);
      }

      container.classList.add('prpb-mask--container');
      container.appendChild(el.current);
    }

    return () => {
      container.removeChild(el.current);
    };
  }, [container]);

  logger.log('[InjectedApp] rendering mask on page', mask, container, el.current);
  return ReactDOM.createPortal(<AdMask key={mask.elementId} input={mask} />, el.current);
};

const AdMask = ({ input }: { input: IMaskInputData }): JSX.Element => {
  return (<div>
    <h2 className="prpb-mask__overlay__header">
      <strong className={(input.winningBidder ? 'green-border' : null)}>
        Professor Prebid
      </strong>
    </h2>

    <ul>
      {
        Object.entries(input)
          .filter(([key, value]) => ['auctionTime', 'creativeRenderTime', 'elementId', 'winningBidder', 'winningCPM'].includes(key))
          .map(([key, value]) => <li key={key}> <strong>{key}: </strong>{value}</li>)
      }
      <li key="Bidders">
        <strong>
          Bidders:
        </strong>
        <ul>
          {Array.from(new Set(input?.bids?.map(bidder => bidder.bidder))).map(bidder => <li key={bidder}>{bidder}</li>)}
        </ul>
      </li>
    </ul>
  </div>);
};

// Helpers

const createMaskContainerElement = () => {
  const el = document.createElement('div');
  el.classList.add('prpb-mask__overlay');


  return el;
}
interface IMaskInputData {
  elementId: string;
  creativeRenderTime: number;
  auctionTime: number;
  bids: IPrebidBid[];
  winningBidder: string;
  winningCPM: number;

}

interface IAdMaskPortalProps {
  container: HTMLElement;
  mask: IMaskInputData;
}

export default InjectedApp;
