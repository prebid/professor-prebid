import { popupHandler } from './popupHandler';
import { IGoogleAdManagerDetails } from '../../inject/scripts/googleAdManager';
import { ITcfDetails } from '../../inject/scripts/tcf';
import { IPrebidDetails } from '../../inject/scripts/prebid';
import { HashRouter as Router, Route, Link, Switch } from 'react-router-dom'
import { appHandler } from '../App/appHandler';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPollH, faSlidersH, faAd, faLaptopCode, faWindowRestore, faMoneyBill, faCoins, faUserFriends } from '@fortawesome/free-solid-svg-icons'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import React, { useCallback, useEffect, useState } from 'react';
import logger from '../../logger';
import PrebidAdUnitsComponent from './components/adUnits/AdUnitsComponent';
import UserIdsComponent from './components/userIds/UserIdsComponent';
import ConfigComponent from './components/config/ConfigComponent';
import TimelineComponent from './components/timeline/TimeLineComponent';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Typography, { TypographyProps } from '@mui/material/Typography';
import MatSwitch from '@mui/material/Switch';
import BidsComponent from './components/bids/BidsComponent';
import { styled } from '@mui/material/styles';

const StyledIconButton = styled(IconButton)<IconButtonProps>(({ theme }) => ({
  flexDirection: 'column',
  color: '#000000',
  fontSize: '25px',
  width: '72px',
  height: '52px',
  textAlign: 'center',
  lineHeight: '1.6',
  border: '2px solid #000000',
  borderRadius: '10%',
}));

const StyledTypo = styled(Typography)<TypographyProps>(({ theme }) => ({
  'fontSize': '15px',
  'color': '#000000'
}));

export const Popup = (): JSX.Element => {
  const [consoleState, setConsoleState] = useState<boolean>(null);
  useEffect(() => {
    popupHandler.getToggleStateFromStorage((checked: boolean) => {
      setConsoleState(checked);
    });
  }, [consoleState]);

  const [googleAdManager, setGamDetails] = useState<IGoogleAdManagerDetails>();
  useEffect(() => {
    appHandler.getGamDetailsFromBackground((data: IGoogleAdManagerDetails) => {
      logger.log('[App] received Google AdManager Details from background', data);
      setGamDetails(data)
    });
  }, [googleAdManager]);

  const [prebid, setPrebidDetails] = useState<IPrebidDetails>();
  useEffect(() => {
    appHandler.getPrebidDetailsFromBackground((data: IPrebidDetails) => {
      logger.log('[App] received Prebid Details from background', data);
      setPrebidDetails(data)
    });
  }, [prebid]);

  const [tcf, setTcfDetails] = useState<ITcfDetails>();
  useEffect(() => {
    appHandler.getTcfDetailsFromBackground((data: ITcfDetails) => {
      logger.log('[App] received Prebid Details from background', data);
      setTcfDetails(data)
    });
  }, [tcf]);

  const handleConsoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConsoleState(event.target.checked);
    popupHandler.onConsoleToggle(event.target.checked);
  };

  const dfp_open_console = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      const file = './openDfpConsole.bundle.js';
      chrome.tabs.executeScript(currentTab.id, { file });
    });
  }

  return (
    <Box className="popup" sx={{ height: '600px', width: '780px', overflowX: 'scroll' }}>
      <Router>

        <AppBar position="sticky" sx={{
          alignItems: 'center',
          display: 'flex',
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          height: '62px',
          background: '#F99B0C',
          '& a:link': {
            textDecoration: 'none'
          }
        }}>

          <Typography variant="h6" sx={{
            flex: 0.2,
          }}>Prof. Prebid</Typography>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row-reverse',
            flex: 0.8,
            justifyContent: 'space-around'
          }}>
            <Box sx={{ paddingTop: '10px' }}>
              <MatSwitch checked={consoleState || false} onChange={handleConsoleChange} sx={{ transform: 'rotate(90deg)', width: '62px' }}></MatSwitch>
            </Box>

            <StyledIconButton size="small" onClick={dfp_open_console}>
              <FontAwesomeIcon icon={faGoogle} />
              <StyledTypo>GAM</StyledTypo>
            </StyledIconButton>

            <Link to="/userId">
              <StyledIconButton size="small" >
                <FontAwesomeIcon icon={faUserFriends} />
                <StyledTypo>User ID</StyledTypo>
              </StyledIconButton>
            </Link>

            <Link to="/config">
              <StyledIconButton size="small">
                <FontAwesomeIcon icon={faSlidersH} />
                <StyledTypo>Config</StyledTypo>
              </StyledIconButton>
            </Link>

            <Link to="/timeline">
              <StyledIconButton size="small" >
                <FontAwesomeIcon icon={faPollH} />
                <StyledTypo>Timeline</StyledTypo>
              </StyledIconButton>
            </Link>

            <Link to="/bids">
              <StyledIconButton size="small" >
                <FontAwesomeIcon icon={faCoins} />
                <StyledTypo>Bids</StyledTypo>
              </StyledIconButton>
            </Link>

            <Link to="/">
              <StyledIconButton size="small">
                <FontAwesomeIcon icon={faAd} />
                <StyledTypo>Ad Units</StyledTypo>
              </StyledIconButton>
            </Link>

            {/* <StyledIconButton size="small" onClick={popupHandler.openDebugTab}><FontAwesomeIcon icon={faLaptopCode} />
            <Typography className="label">Debug</Typography>
          </StyledIconButton> */}

          </Box>
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
