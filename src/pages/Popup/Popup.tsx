import React, { useCallback, useEffect, useState } from 'react';
import './Popup.scss';
import logger from '../../logger';
import Switch from 'react-switch';
import { popupHandler } from './popupHandler';
import { IPopUpState, IDataFromContentScript , } from '../../index.d';
export const Popup = () => {
  const [consoleState, setConsoleState] = useState(null);
  const [data, setPopUpState] = useState<IPopUpState>({
    adsDetected: null,
    numOfBidders: null,
    numOfNoBids: null,
    numOfAvailableBids: null,
    timings: {
      preAuction: null,
      auction: null,
      adServer: null,
    },
  });

  useEffect(() => {
    logger.log('[Popup] init()')
    popupHandler.handleDataFromContentScript((dataFromConetentScript: IDataFromContentScript) => {
      logger.log('[Popup] received data from content script', dataFromConetentScript)
      const newData: IPopUpState = {
        adsDetected: dataFromConetentScript.dfs.slots.length,
        numOfBidders: Array.from(new Set(dataFromConetentScript.dfs.allBids.map((bid) => bid.bidder))).length,
        numOfNoBids: Array.from(new Set(dataFromConetentScript.dfs.allBids.map((bid) => bid.msg === 'no bid' && bid))).length,
        numOfAvailableBids: Array.from(new Set(dataFromConetentScript.dfs.allBids.map((bid) => bid.msg === 'Bid available' && bid))).length,
        timings: {
          preAuction: 0,
          auction: 0,
          adServer: 0,
        },
      }
      setPopUpState(newData);
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
                {/* No Bid Ratio: {data.numOfNoBids}/{data.numOfBidders} */}
                No Bid Ratio: {data.numOfNoBids}/{data.numOfAvailableBids}
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
          <p>{JSON.stringify(data)}</p>
          <button onClick={handleOpenMainTab}>open main tab</button>
        </div>
      </main>
    </div>
  );
};
