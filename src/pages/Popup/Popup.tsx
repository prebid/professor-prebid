import React, { useCallback, useEffect, useState } from 'react';
import './Popup.scss';
import logger from '../../logger';
import Switch from 'react-switch';
import { popupHandler } from './popupHandler';

interface ContentScriptData {
  adsDetected: number;
  numOfBidders: number;
  numOfNoBids: number;
  timings: {
    preAuction: number;
    auction: number;
    adServer: number;
  };
}

export const Popup = () => {
  const [consoleState, setConsoleState] = useState(null);
  const [data, setData] = useState<ContentScriptData>({
    adsDetected: null,
    numOfBidders: null,
    numOfNoBids: null,
    timings: {
      preAuction: null,
      auction: null,
      adServer: null,
    },
  });

  useEffect(() => {
    popupHandler.handleDataFromContentScript((payload: ContentScriptData) => {
      logger.log('[POPUP] received data from content script', payload);
      setData(payload);
    });

    popupHandler.getToggleStateFromStorage((checked: boolean) => {
      setConsoleState(checked);
    });
  }, []);

  const handleConsoleChange = useCallback((checked: boolean) => {
    setConsoleState(checked);
    popupHandler.onConsoleToggle(checked);
  }, []);

  const handleOpenMainTab = useCallback(() => {
    popupHandler.openMainTab();
  }, []);

  return (
    <div className="popup">
      <header>
        <h1>Professor Prebid</h1>
      </header>
      <main>
        <aside className="data-info">
          <div>
            <ul className="stats-list">
              <li>Ads Detected: {data.adsDetected}</li>
              <li>Bidders: {data.numOfBidders}</li>
              <li>
                No Bid Ratio: {data.numOfNoBids}/{data.numOfBidders}
              </li>
            </ul>
          </div>
          <div className="console-switch">
            <Switch
              onChange={handleConsoleChange}
              checked={consoleState || false}
              disabled={consoleState === null}
              checkedIcon={false}
              uncheckedIcon={false}
              onColor="#5694cc"
              onHandleColor="#004E91"
              activeBoxShadow={null}
              height={18}
              width={51}
              handleDiameter={25}
            />
            <div>Open Console</div>
          </div>
        </aside>
        <div>
          <button onClick={handleOpenMainTab}>open main tab</button>
        </div>
      </main>
    </div>
  );
};
