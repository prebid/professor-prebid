import React, { useCallback, useEffect, useState } from 'react';
import './Popup.scss';
import logger from '../../logger';
import Switch from 'react-switch';
import { popupHandler } from './popupHandler';
import { IGoogleAdManagerDetails } from '../../inject/scripts/googleAdManager';
import { ITcfDetails } from '../../inject/scripts/tcf';
import { IPrebidDetails } from '../../inject/scripts/prebid';


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
        adsDetected: dataFromConetentScript.googleAdManager.slots.length,
        numOfBidders: Array.from(new Set(dataFromConetentScript.prebid.bids.map((bid) => bid.bidder))).length,
        numOfNoBids: Array.from(new Set(dataFromConetentScript.prebid.bids.map((bid) => bid.status === 'no bid' && bid))).length,
        numOfAvailableBids: Array.from(new Set(dataFromConetentScript.prebid.bids.map((bid) => bid.status === 'Bid available'))).length,
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
      {/* <div className="component-links">
        <div className="component-links">
          <div>
            <p>Stats</p>
            <i className="fas fa-camera"></i>
            <i></i>
          </div>
          <div>
            <p>Timeline</p>
            <i className="fas fa-camera"></i>
            <i></i>
          </div>
          <div>
            <p>Config</p>
            <i className="fas fa-camera"></i>
            <i></i>
          </div>
        </div>
      </div> */}

    </div>
  );
};


export interface IPopUpState {
  adsDetected: number;
  numOfBidders: number;
  numOfNoBids: number;
  numOfAvailableBids: number;
  timings: {
    preAuction: number;
    auction: number;
    adServer: number;
  };
}

interface IDataFromContentScript {
  prebid: IPrebidDetails;
  googleAdManager: IGoogleAdManagerDetails;
  tcf: ITcfDetails;
}