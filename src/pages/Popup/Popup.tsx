import './Popup.scss';
import { popupHandler } from './popupHandler';
import { IGoogleAdManagerDetails } from '../../inject/scripts/googleAdManager';
import { ITcfDetails } from '../../inject/scripts/tcf';
import { IPrebidDetails } from '../../inject/scripts/prebid';
import { HashRouter as Router, Route, Link, Switch } from 'react-router-dom'
import { appHandler } from '../App/appHandler';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPollH, faSlidersH, faAd, faLaptopCode, faWindowRestore } from '@fortawesome/free-solid-svg-icons'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import React, { useCallback, useEffect, useState } from 'react';
import logger from '../../logger';
import PrebidDetailsComponent from '../App/components/details/PrebidDetailsComponent';
import TcfDetailsComponent from '../App/components/TcfDetailsComponent';
import PrebidConfigComponent from '../App/components/config/PrebidConfigComponent';
import GanttChartComponent from '../App/components/timeline/GanttChartComponent';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import PrebidDetailsBidderRequestsComponent from '../App/components/details/PrebidDetailsBidderRequestsComponent';
import MatSwitch from '@mui/material/Switch';
import BarChartIcon from '@mui/icons-material/BarChart';
import TuneIcon from '@mui/icons-material/Tune';

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
    postAuctionEndTimestamp: null
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

  const handleConsoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConsoleState(event.target.checked);
    popupHandler.onConsoleToggle(event.target.checked);
  };


  const handleOpenDebugTab = useCallback(() => {
    popupHandler.openDebugTab()
  }, []);

  const dfp_open_console = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      const file = './openDfpConsole.bundle.js';
      chrome.tabs.executeScript(currentTab.id, { file });
    });
  }

  useEffect(() => {
    const loop = () => {
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
      requestIdleCallback(loop)
    };
    loop();
  }, []);

  return (
    <Box className="popup" sx={{ height: '600px', width: '780px' }}>
      <Router>

        <AppBar position="static">

          <Toolbar className="nav">
            <Typography variant="h6">Professor Prebid</Typography>
            <Link to="/">
              <IconButton size="small" >
                <FontAwesomeIcon icon={faAd} />
                <Typography className="label">Prebid</Typography>
              </IconButton>
            </Link>

            <Link to="/timeline">
              <IconButton size="small" >
                <FontAwesomeIcon icon={faPollH} />
                <Typography className="label">Timeline</Typography>
                {/* <BarChartIcon sx={{ transform: 'rotate(90deg)' }} /> */}
              </IconButton>
            </Link>

            <Link to="/config">
              <IconButton size="small">
                <FontAwesomeIcon icon={faSlidersH} />
                {/* <TuneIcon sx={{ transform: 'rotate(90deg)' }} /> */}
                <Typography className="label">Config</Typography>
              </IconButton>
            </Link>

            <Link to="/tcf">
              <IconButton size="small"><FontAwesomeIcon icon={faWindowRestore} />
                <Typography className="label">TCF</Typography>
              </IconButton>
            </Link>

            <IconButton size="small" onClick={handleOpenDebugTab}><FontAwesomeIcon icon={faLaptopCode} />
              <Typography className="label">Debug</Typography>
            </IconButton>

            <IconButton size="small" onClick={dfp_open_console}><FontAwesomeIcon icon={faGoogle} />
              <Typography className="label">GAM</Typography>
            </IconButton>
            <MatSwitch checked={consoleState || false} onChange={handleConsoleChange} inputProps={{ 'aria-label': 'controlled' }} sx={{ transform: 'rotate(90deg)' }}></MatSwitch>
          </Toolbar>

        </AppBar>

        <Switch>

          <Route exact path="/">
            {prebid && <PrebidDetailsComponent prebid={prebid}></PrebidDetailsComponent>}
          </Route>

          <Route exact path="/timeline" >
            {prebid && <GanttChartComponent prebid={prebid} googleAdManager={googleAdManager}></GanttChartComponent>}
            {prebid && <PrebidDetailsBidderRequestsComponent prebid={prebid}></PrebidDetailsBidderRequestsComponent>}
          </Route>

          <Route path="/config">
            {prebid?.config && <PrebidConfigComponent prebid={prebid}></PrebidConfigComponent>}
          </Route>

          <Route exact path="/tcf">
            {tcf && <TcfDetailsComponent tcf={tcf}></TcfDetailsComponent>}
          </Route>

        </Switch>

      </Router>
    </Box>

  );
};
