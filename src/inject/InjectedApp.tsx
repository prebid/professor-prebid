import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import './ad-mask.scss';
import logger from '../logger';
import constants from '../constants.json';
import { sendToContentScript } from '../utils';
import { IMask, IBidder, IAdMaskPortalProps } from '../index.d';

const InjectedApp = (): JSX.Element => {
  const [consoleState, setConsoleState] = useState(false);
  const [masks, setMasks] = useState<IMask[]>([]);

  logger.log('[InjectedApp] init', consoleState, masks)
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
            logger.log('[InjectedApp] failed to render mask on page, could not find element by targetId', mask);
            return null;
          }

          return <AdMaskPortal key={mask.targetId} container={container} mask={mask} />;
        })}
    </div>
  );
};

const AdMaskPortal: React.FC<IAdMaskPortalProps> = ({ container, mask }) => {
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

  logger.log('[InjectedApp] rendering mask on page', mask, container, el.current);
  return ReactDOM.createPortal(<AdMask input={mask} />, el.current);
};

const AdMask = ({ input }: { input: IMask }): JSX.Element => {
  return (<div>
    <h2>
      <strong>
        Professor Prebid - TBD
      </strong>
    </h2>
    <br />
    <ul>
      {
        Object.entries(input)
          .filter(([key, value]) => ['auctionTime', 'creativeRenderTime', 'targetId', 'winningBidder', 'winningCPM'].includes(key))
          .map(([key, value]) => <li key={key}> <strong>{key}: </strong>{value}</li>)
      }
      <li key="Bidders">
        <strong>
          Bidders:
        </strong>
        <ul>
          {Array.from(new Set(input?.bidders?.map((bidder: IBidder) => bidder.bidder))).map((bidder) => <li key={bidder}>{bidder}</li>)}
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

export default InjectedApp;
