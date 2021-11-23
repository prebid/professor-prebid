import React, { useEffect, useRef } from 'react';
import { IPrebidDetails } from '../scripts/prebid';
import ReactDOM from 'react-dom';
import AdMaskComponent from './AdMask';

const AdMaskPortal: React.FC<IAdMaskPortalProps> = ({ container, mask, consoleState }) => {
  const el = useRef<HTMLDivElement>(
    (() => {
      const el = document.createElement('div');
      const width = container?.offsetWidth || container?.clientWidth;
      const height = container?.offsetHeight || container?.clientHeight;
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      el.style.display = height < 100 ? 'inline-block' : 'block';
      el.style.opacity = '0.9';
      el.style.position = 'absolute';
      el.style.top = '0';
      el.style.bottom = '0';
      el.style.left = '0';
      el.style.right = '0';
      el.style.zIndex = '100000000';
      el.style.padding = '4px 8px';
      el.classList.add('prpb-mask__overlay');
      el.id = `prpb-mask--container-${mask.elementId}`;
      return el;
    })()
  );

  useEffect(() => {
    container?.classList.add('prpb-mask--container');
    const slotMaskElement = document.getElementById(`prpb-mask--container-${mask.elementId}`) as HTMLDivElement;
    if (consoleState && !slotMaskElement) {
      container?.appendChild(el.current);
    }
    if (consoleState && slotMaskElement) {
      // update height & width
      slotMaskElement.style.width = `${container?.offsetWidth || container?.clientWidth}px`;
      slotMaskElement.style.height = `${container?.offsetHeight || container?.clientHeight}px`;
    }
    if (!consoleState) {
      slotMaskElement?.parentNode.removeChild(slotMaskElement);
    }
  }, [container, mask, consoleState]);

  const { creativeRenderTime, elementId, winningCPM, winningBidder, currency, timeToRespond } = mask;
  return ReactDOM.createPortal(
    <AdMaskComponent
      key={mask.elementId}
      creativeRenderTime={creativeRenderTime}
      elementId={elementId}
      winningCPM={winningCPM}
      winningBidder={winningBidder}
      currency={currency}
      timeToRespond={timeToRespond}
    />,
    el.current
  );
};

interface IAdMaskPortalProps {
  container: HTMLElement;
  mask: IMaskInputData;
  consoleState: boolean;
}

interface IMaskInputData {
  elementId: string;
  creativeRenderTime: number;
  winningBidder: string;
  winningCPM: number;
  currency: string;
  timeToRespond: number;
}

export default AdMaskPortal;
