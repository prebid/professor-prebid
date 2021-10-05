import './Popup.scss';
import { popupHandler } from './popupHandler';
import { IGoogleAdManagerDetails } from '../../inject/scripts/googleAdManager';
import { ITcfDetails } from '../../inject/scripts/tcf';
import { IPrebidDetails } from '../../inject/scripts/prebid';
import { HashRouter as Router, Route, Link, Switch } from 'react-router-dom'
import { appHandler } from '../App/appHandler';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPollH, faEllipsisV, faSlidersH, faHome, faAd, faLaptopCode, faWindowRestore } from '@fortawesome/free-solid-svg-icons'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import React, { useCallback, useEffect, useState } from 'react';
import logger from '../../logger';
import ReactSwitch from 'react-switch';
import GoogleAdManagerDetailsComponent from '../App/components/GoogleAdManagerDetailsComponent';
import InfoComponent from '../App/components/InfoComponent';
import PrebidDetailsComponent from '../App/components/details/PrebidDetailsComponent';
import TcfDetailsComponent from '../App/components/TcfDetailsComponent';
import TimeLine from '../App/components/TimelineComponent';
import PrebidConfigComponent from '../App/components/config/PrebidConfigComponent';

export const Popup = (): JSX.Element => {
  const [consoleState, setConsoleState] = useState<boolean>(null);

  const [googleAdManager, setGamDetails] = useState<IGoogleAdManagerDetails>({
    slots: [],
    sra: false,
    async: false,
    fetchBeforeKeyvalue: false,
    fetchBeforeRefresh: false,
    slotEvents: {},
    postAuctionStartTimestamp: null,
    postAuctionEndTimestamp: null,
  });

  const [prebid, setPrebidDetails] = useState<IPrebidDetails>({
    version: null,
    slots: [],
    timeout: null,
    events: [],
    config: null,
    bids: [],
    auctions: {}
  });

  const [tcf, setTcfDetails] = useState<ITcfDetails>({
    v1: {
      cmpLoaded: false,
      gdprApplies: false,
      consentData: ''
    },
    v2: {
      cmpLoaded: false,
      gdprApplies: false,
      consentData: ''
    }
  });

  useEffect(() => {
    setInterval(() => {
      popupHandler.getToggleStateFromStorage((checked: boolean) => {
        setConsoleState(checked);
      });

      appHandler.getGamDetailsFromBackground((data: IGoogleAdManagerDetails) => {
        logger.log('[App] received Google AdManager Details from background', data);
        setGamDetails(data)
      });

      appHandler.getPrebidDetailsFromBackground((data: IPrebidDetails) => {
        logger.log('[App] received Prebid Details from background', data);
        setPrebidDetails(data)
      });

      appHandler.getTcfDetailsFromBackground((data: ITcfDetails) => {
        logger.log('[App] received Prebid Details from background', data);
        setTcfDetails(data)
      });

    }, 1000)

  }, []);

  const handleConsoleChange = useCallback((nextChecked: boolean) => {
    setConsoleState(nextChecked);
    popupHandler.onConsoleToggle(nextChecked);
  }, []);

  const handleOpenDebugTab = useCallback(() => popupHandler.openDebugTab(), []);

  return (
    <div className="popup">
      <header>
        <h1>Professor Prebid</h1>
        <button><FontAwesomeIcon icon={faEllipsisV} /></button>
      </header>
      <main>
        <aside className="data-info">
          <InfoComponent prebid={prebid} googleAdManager={googleAdManager}></InfoComponent>
          <div className="console-switch">
            <ReactSwitch
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
        <Router>
          <div style={{ width: '100%' }}>
            <div className="component-links">
              <nav>
                <Link to="/">
                  <button><FontAwesomeIcon icon={faHome} size="lg" />Home</button>
                </Link>
                <Link to="/googleAdManager">
                  <button><FontAwesomeIcon icon={faGoogle} size="lg" /><br></br>GAM</button>
                </Link>
                <Link to="/prebid">
                  <button><FontAwesomeIcon icon={faAd} size="lg" />Prebid</button>
                </Link>
                <Link to="/timeline">
                  <button><FontAwesomeIcon icon={faPollH} size="lg" />Timeline</button>
                </Link>
                <Link to="/config">
                  <button><FontAwesomeIcon icon={faSlidersH} size="lg" />Config</button>
                </Link>
                <Link to="/tcf">
                  <button><FontAwesomeIcon icon={faWindowRestore} size="lg" /><br></br>TCF</button>
                </Link>
                <button onClick={handleOpenDebugTab}><FontAwesomeIcon icon={faLaptopCode} size="lg" />Debug</button>
              </nav>
            </div>

            <Switch>
              <Route exact path="/" >
              </Route>
              <Route exact path="/googleAdManager">
                <GoogleAdManagerDetailsComponent googleAdManager={googleAdManager}></GoogleAdManagerDetailsComponent>
              </Route>
              <Route exact path="/prebid">
                <PrebidDetailsComponent prebid={prebid}></PrebidDetailsComponent>
              </Route>
              <Route exact path="/timeline" >
                <TimeLine prebid={prebid} googleAdManager={googleAdManager}></TimeLine>
              </Route>
              <Route path="/config">
                <PrebidConfigComponent prebid={prebid}></PrebidConfigComponent>
              </Route>
              <Route exact path="/tcf">
                <TcfDetailsComponent tcf={tcf}></TcfDetailsComponent>
              </Route>
            </Switch>
          </div>
        </Router>
      </main>
    </div>
  );
};
