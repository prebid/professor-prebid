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
import PrebidAdUnitsComponent from './components/adUnits/AdUnitsComponent';
import UserIdsComponent from './components/userIds/UserIdsComponent';
import ConfigComponent from './components/config/ConfigComponent';
import TimelineComponent from './components/timeline/TimeLineComponent';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MatSwitch from '@mui/material/Switch';
import BidsComponent from './components/bids/BidsComponent';
import MoneyIcon from '@mui/icons-material/Money';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import BarChartIcon from '@mui/icons-material/BarChart';

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
    auctions: {},
    eids: null
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
            <Typography variant="h6">Prof. Prebid</Typography>

            <Link to="/">
              <IconButton size="small" >
                <FontAwesomeIcon icon={faAd} />
                <Typography className="label">Ad Units</Typography>
              </IconButton>
            </Link>

            <Link to="/bids">
              <IconButton size="small" >
                <MoneyIcon fontSize="medium" />
                <Typography className="label">Bids</Typography>
              </IconButton>
            </Link>

            <Link to="/timeline">
              <IconButton size="small" >
                {/* <BarChartIcon sx={{ transform: 'rotate(270deg)' }} /> */}
                <FontAwesomeIcon icon={faPollH} />
                <Typography className="label">Timeline</Typography>
              </IconButton>
            </Link>

            <Link to="/config">
              <IconButton size="small">
                <FontAwesomeIcon icon={faSlidersH} />
                {/* <TuneIcon sx={{ transform: 'rotate(90deg)' }} /> */}
                <Typography className="label">Config</Typography>
              </IconButton>
            </Link>

            <Link to="/userId">
              <IconButton size="small" >
                <PeopleOutlineIcon fontSize="medium" />
                <Typography className="label">User ID</Typography>
              </IconButton>
            </Link>

            {/*<IconButton size="small" onClick={handleOpenDebugTab}><FontAwesomeIcon icon={faLaptopCode} />
              <Typography className="label">Debug</Typography>
            </IconButton> */}

            <IconButton size="small" onClick={dfp_open_console}>
              <FontAwesomeIcon icon={faGoogle} />
              <Typography className="label">GAM</Typography>
            </IconButton>

            <MatSwitch checked={consoleState || false} onChange={handleConsoleChange} inputProps={{ 'aria-label': 'controlled' }} sx={{ transform: 'rotate(90deg)' }}></MatSwitch>
          </Toolbar>

        </AppBar>

        <Switch>

          <Route exact path="/">
            {prebid && <PrebidAdUnitsComponent prebid={prebid}></PrebidAdUnitsComponent>}
          </Route>

          <Route exact path="/bids">
            {prebid && <BidsComponent prebid={prebid}></BidsComponent>}
          </Route>

          <Route exact path="/timeline">
            {prebid && <TimelineComponent prebid={prebid}></TimelineComponent>}
          </Route>

          <Route path="/config">
            {prebid?.config && <ConfigComponent prebid={prebid} tcf={tcf}></ConfigComponent>}
          </Route>

          <Route exact path="/userId">
            {tcf && <UserIdsComponent prebid={prebid}></UserIdsComponent>}
          </Route>

        </Switch>

      </Router>
    </Box>
  );
};
