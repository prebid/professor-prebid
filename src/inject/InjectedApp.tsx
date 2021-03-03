import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import './ad-mask.scss';
import logger from '../logger';
import constants from '../constants.json';
import { sendToContentScript } from '../utils';

interface IBidder {
  slotElementId: string;
  adId: string;
  dealId: string | null;
  auction: string;
  adUnitPath: string;
  bidder: string;
  time: number;
  cpm: number;
  slotSize: string;
  netRevenue: boolean;
  creativeId: string | number;
  msg: string;
  nonRenderedHighestCpm: boolean;
  rendered: boolean;
  bidRequestTime: number;
  bidResponseTime: number;
  created: number;
  modified: number;
  type: string;
}

interface IMask {
  targetId: string;
  creativeRenderTime: number;
  auctionTime: number;
  bidders: IBidder[];
}

const InjectedApp: React.FC = () => {
  const [consoleState, setConsoleState] = useState(false);
  const [masks, setMasks] = useState<IMask[]>([]);

  useEffect(() => {
    // listen from content script
    document.addEventListener(constants.SAVE_MASK, (event) => {
      const newMask = (event as CustomEvent).detail;

      setMasks((v) => [...v, newMask]);
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
      {consoleState &&
        masks.map((mask) => {
          const container = document.getElementById(mask.targetId);

          if (!container) {
            logger.log('failed to render mask on page, could not find element by targetId', mask);
            return null;
          }

          return <AdMaskPortal key={mask.targetId} container={container} mask={mask} />;
        })}
    </div>
  );
};

interface AdMaskPortalProps {
  container: HTMLElement;
  mask: IMask;
}

const AdMaskPortal: React.FC<AdMaskPortalProps> = ({ container, mask }) => {
  const el = useRef<HTMLDivElement>(createMaskContainerElement());

  useEffect(() => {
    if (container) {
      container.classList.add('prpb-mask--container');
      container.appendChild(el.current);
    }

    return () => {
      container.removeChild(el.current);
    };
  }, [container]);

  logger.log('rendering mask on page', mask, container, el.current);
  return ReactDOM.createPortal(<AdMask />, el.current);
};

const AdMask: React.FC = () => {
  return <div>Professor Prebid - TBD</div>;
};

// Helpers

function createMaskContainerElement() {
  const el = document.createElement('div');
  el.classList.add('prpb-mask__overlay');

  return el;
}

export default InjectedApp;
