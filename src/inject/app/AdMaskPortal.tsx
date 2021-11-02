import React, { useEffect, useRef } from 'react';
import { IPrebidDetails } from '../scripts/prebid';
import ReactDOM from 'react-dom';
import AdMaskComponent from './AdMask'

const AdMaskPortal: React.FC<IAdMaskPortalProps> = ({ container, mask, consoleState }) => {
    const el = useRef<HTMLDivElement>(
        (() => {
            const el = document.createElement('div');
            const width = container?.offsetWidth || container?.clientWidth;
            const height = container?.offsetHeight || container?.clientHeight;
            el.style.width = `${(width)}px`;
            el.style.height = `${height}px`;
            el.style.display = height < 100 ? 'inline-block' : 'block';
            el.style.opacity = '0.8';
            el.style.position = 'absolute';
            el.style.top = '0';
            el.style.bottom = '0';
            el.style.left = '0';
            el.style.right = '0';
            el.style.zIndex = '100000000';
            el.style.padding = '4px 8px';
            el.classList.add('prpb-mask__overlay');
            return el;
        })()
    );

    useEffect(() => {
        console.log('test draw masks');
        container?.classList.add('prpb-mask--container');
        // delete old masks
        const elements = container?.getElementsByClassName('prpb-mask__overlay');
        while (elements && elements[0]) {
            elements[0].parentNode.removeChild(elements[0]);
        }

        if (consoleState) {
            container?.appendChild(el.current);
        }
    }, [container, consoleState]);

    const { prebid, creativeRenderTime, elementId, winningCPM, winningBidder } = mask;
    return ReactDOM.createPortal(
        <AdMaskComponent
            key={mask.elementId}
            prebid={prebid}
            creativeRenderTime={creativeRenderTime}
            elementId={elementId}
            winningCPM={winningCPM}
            winningBidder={winningBidder}
        />
        , el.current
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
    prebid: IPrebidDetails
}

export default AdMaskPortal;
