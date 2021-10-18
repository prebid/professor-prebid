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
import InfoComponent from '../App/components/InfoComponent';
import PrebidDetailsComponent from '../App/components/details/PrebidDetailsComponent';
import TcfDetailsComponent from '../App/components/TcfDetailsComponent';
import PrebidConfigComponent from '../App/components/config/PrebidConfigComponent';
import GanttChartComponent from '../App/components/timeline/GanttChartComponent';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';

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

  const handleConsoleChange = useCallback((nextChecked: boolean) => {
    setConsoleState(nextChecked);
    popupHandler.onConsoleToggle(nextChecked);
  }, []);

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

  return (

    <Box className="popup" sx={{ height: '600px', width: '780px' }}>

      <Drawer className="drawer" variant="permanent" anchor="left">

        <AppBar position="static">
          <Toolbar className="nav">
            <h1>Professor Prebid</h1>
          </Toolbar>
        </AppBar>

        <InfoComponent prebid={prebid} googleAdManager={googleAdManager}></InfoComponent>

        <Box className="console-switch">
          <ReactSwitch onChange={handleConsoleChange} checked={consoleState || false} disabled={consoleState === null}
            checkedIcon={false} uncheckedIcon={false} onColor="#5694cc" onHandleColor="#004E91" activeBoxShadow={null}
            height={18} width={51} handleDiameter={25} />
          <div>Open Console</div>
        </Box>

      </Drawer>

      <Box sx={{ marginLeft: '201px' }}>

        <Router>

          <AppBar position="static">

            <Toolbar className="nav">

              <Link to="/">
                <IconButton size="small"><FontAwesomeIcon icon={faAd} />
                  <Typography className="label">
                    Prebid
                  </Typography>
                </IconButton>
              </Link>

              <Link to="/timeline">
                <IconButton size="small"><FontAwesomeIcon icon={faPollH} />
                  <Typography className="label">
                    Timeline
                  </Typography>
                </IconButton>
              </Link>

              <Link to="/config">
                <IconButton size="small"><FontAwesomeIcon icon={faSlidersH} />
                  <Typography className="label">
                    Config
                  </Typography>
                </IconButton>
              </Link>

              <Link to="/tcf">
                <IconButton size="small"><FontAwesomeIcon icon={faWindowRestore} />
                  <Typography className="label">
                    TCF
                  </Typography>
                </IconButton>
              </Link>

              <IconButton size="small" onClick={handleOpenDebugTab}><FontAwesomeIcon icon={faLaptopCode} />
                <div className="label">
                  Debug
                </div>
              </IconButton>

              <IconButton size="small" onClick={dfp_open_console}><FontAwesomeIcon icon={faGoogle} />
                <Typography className="label">
                  GAM
                </Typography>
              </IconButton>

            </Toolbar>

          </AppBar>

          <Switch>

            <Route exact path="/">
              <PrebidDetailsComponent prebid={prebid}></PrebidDetailsComponent>
            </Route>

            <Route exact path="/timeline" >
              <GanttChartComponent prebid={prebid} googleAdManager={googleAdManager}></GanttChartComponent>
            </Route>

            <Route path="/config">
              <PrebidConfigComponent prebid={prebid}></PrebidConfigComponent>
            </Route>

            <Route exact path="/tcf">
              <TcfDetailsComponent tcf={tcf}></TcfDetailsComponent>
            </Route>

          </Switch>

        </Router>

      </Box>

    </Box>
  );
};
