import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import AdMaskComponent, { IMaskInputData } from './AdMask';
import logger from '../../logger';

const AdMaskPortal: React.FC<IAdMaskPortalProps> = ({ container, mask, consoleState }) => {
  const { creativeRenderTime, elementId, winningCPM, winningBidder, currency, timeToRespond } = mask;
  const element = useRef<HTMLDivElement>(document.createElement('div'));

  useEffect(() => {
    logger.log('[AdMaskPortal] Mounting AdMaskPortal');
    const slotMaskElement = document.getElementById(`prpb-mask--container-${mask.elementId}`);
    if (consoleState) {
      if (!slotMaskElement) {
        const width = container?.offsetWidth || container?.clientWidth;
        const height = container?.offsetHeight || container?.clientHeight;
        element.current.style.width = `${width}px`;
        element.current.style.height = `${height}px`;
        element.current.style.display = height < 100 ? 'inline-block' : 'block';
        element.current.style.opacity = '0.7';
        element.current.style.position = 'absolute';
        element.current.style.zIndex = '100000000';
        element.current.style.padding = '4px 8px';
        element.current.style.wordBreak = 'break-all';
        element.current.style.overflow = 'hidden';
        element.current.classList.add('prpb-mask__overlay');
        element.current.id = `prpb-mask--container-${mask.elementId}`;
        container?.prepend(element.current);
      } else {
        slotMaskElement.style.width = `${container?.offsetWidth || container?.clientWidth}px`;
        slotMaskElement.style.height = `${container?.offsetHeight || container?.clientHeight}px`;
      }
    } else {
      slotMaskElement?.parentNode.removeChild(slotMaskElement);
    }
  }, [mask, consoleState, container]);

  return ReactDOM.createPortal(
    <AdMaskComponent
      key={`AdMask-${elementId}`}
      creativeRenderTime={creativeRenderTime}
      elementId={elementId}
      winningCPM={winningCPM}
      winningBidder={winningBidder}
      currency={currency}
      timeToRespond={timeToRespond}
    />,
    element.current
  );
};

interface IAdMaskPortalProps {
  mask: IMaskInputData;
  consoleState: boolean;
  container: HTMLElement;
}

export default AdMaskPortal;
