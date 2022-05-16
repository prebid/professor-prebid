import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import AdMaskComponent, { IMaskInputData } from './AdMask';
import logger from '../../logger';

export const getMaxZIndex = () =>
  Math.max(
    ...Array.from(document.querySelectorAll('*'), (el) => parseFloat(window.getComputedStyle(el).zIndex)).filter((zIndex) => !Number.isNaN(zIndex)),
    0
  );

const AdMaskPortal: React.FC<IAdMaskPortalProps> = ({ container, mask, consoleState }) => {
  const { creativeRenderTime, elementId, winningCPM, winningBidder, currency, timeToRespond } = mask;
  const element = useRef<HTMLDivElement>(document.createElement('div'));
  const closePortal = () => {
    document.getElementById(`prpb-mask--container-${mask.elementId}`).style.display = 'none';
  };
  useEffect(() => {
    logger.log('[AdMaskPortal] Mounting AdMaskPortal');
    const slotMaskElement = document.getElementById(`prpb-mask--container-${mask.elementId}`);
    if (consoleState) {
      if (!slotMaskElement) {
        element.current.style.zIndex = `${getMaxZIndex() + 1}`;
        element.current.style.position = 'absolute';
        element.current.style.wordBreak = 'break-all';
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
      closePortal={closePortal}
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
