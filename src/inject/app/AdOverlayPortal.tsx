import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import AdOverlayComponent, { AdOverlayComponentProps } from './AdOverlayComponent';
import logger from '../../logger';

export const getMaxZIndex = () =>
  Math.max(
    ...Array.from(document.querySelectorAll('*'), (el) => parseFloat(window.getComputedStyle(el).zIndex)).filter((zIndex) => !Number.isNaN(zIndex)),
    0
  );

const AdOverlayPortal: React.FC<AdOverlayComponentPropsProps> = ({ container, mask, consoleState }) => {
  const { elementId, winningCPM, winningBidder, currency, timeToRespond } = mask;
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
    <AdOverlayComponent
      key={`AdMask-${elementId}`}
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

interface AdOverlayComponentPropsProps {
  mask: AdOverlayComponentProps;
  consoleState: boolean;
  container: HTMLElement;
}

export default AdOverlayPortal;
