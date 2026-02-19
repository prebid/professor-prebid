import React, { useEffect, useRef, useState } from 'react';
import AdOverlayComponent, { AdOverlayComponentProps } from './AdOverlayComponent';
import { createPortal } from 'react-dom';

export const getMaxZIndex = () => Math.max(...Array.from(document.querySelectorAll('*'), (el) => parseFloat(window.getComputedStyle(el).zIndex)).filter((zIndex) => !Number.isNaN(zIndex)), 0);

const AdOverlayPortal: React.FC<AdOverlayPortalComponentProps> = ({ container, mask, consoleState, pbjsNameSpace }) => {
  const [contentRef, setContentRef] = useState(null);
  const iFrameBody = contentRef?.contentWindow?.document?.body;
  if (iFrameBody) iFrameBody.style.margin = '0';

  const { elementId, winningCPM, winningBidder, currency, timeToRespond } = mask;
  const element = useRef<HTMLDivElement>(document.createElement('div'));
  const closePortal = () => {
    document.getElementById(`prpb-mask--container-${mask.elementId}`).style.display = 'none';
  };

  useEffect(() => {
    const slotMaskElement = document.getElementById(`prpb-mask--container-${mask.elementId}`);
    if (consoleState) {
      if (!slotMaskElement) {
        element.current.style.zIndex = `${getMaxZIndex() + 1}`;
        element.current.style.position = 'absolute';
        element.current.style.wordBreak = 'break-all';
        element.current.id = `prpb-mask--container-${mask.elementId}`;
        element.current.style.top = '0';
        element.current.style.left = '0';
        if (container.style.position === '') {
          container.style.position = 'relative';
        }
        container?.append(element.current);
      } else {
        slotMaskElement.style.width = `${container?.offsetWidth || container?.clientWidth}px`;
        slotMaskElement.style.height = `${container?.offsetHeight || container?.clientHeight}px`;
      }
    } else {
      slotMaskElement?.parentNode.removeChild(slotMaskElement);
    }
  }, [mask, consoleState, container]);

  return createPortal(
    <iframe title={element.current.id} ref={setContentRef} width={`${container?.offsetWidth || container?.clientWidth}px`} height={`${container?.offsetHeight || container?.clientHeight}px`} scrolling="no" frameBorder="0">
      {iFrameBody &&
        createPortal(
          <AdOverlayComponent
            key={`AdMask-${elementId}`}
            elementId={elementId}
            winningCPM={winningCPM}
            winningBidder={winningBidder}
            currency={currency}
            timeToRespond={timeToRespond}
            closePortal={closePortal}
            contentRef={contentRef}
            pbjsNameSpace={pbjsNameSpace}
          />,
          iFrameBody
        )}
    </iframe>,
    element.current
  );
};

interface AdOverlayPortalComponentProps {
  mask: AdOverlayComponentProps;
  consoleState: boolean;
  container: HTMLElement;
  pbjsNameSpace: string;
}

export default AdOverlayPortal;
