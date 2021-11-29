import { IGoogleAdManagerDetails } from '../../inject/scripts/googleAdManager';
import { ITcfDetails } from '../../inject/scripts/tcf';
import { IPrebidDetails } from '../../inject/scripts/prebid';
import { HashRouter as Router, Route, Link, Switch } from 'react-router-dom';
import { appHandler } from '../App/appHandler';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPollH, faSlidersH, faAd, faTools, faCoins, faUserFriends } from '@fortawesome/free-solid-svg-icons';
import React, { useEffect, useState } from 'react';
import logger from '../../logger';
import PrebidAdUnitsComponent from './components/adUnits/AdUnitsComponent';
import UserIdsComponent from './components/userIds/UserIdsComponent';
import ConfigComponent from './components/config/ConfigComponent';
import TimelineComponent from './components/timeline/TimeLineComponent';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Typography, { TypographyProps } from '@mui/material/Typography';
import BidsComponent from './components/bids/BidsComponent';
import ToolsComponent from './components/tools/ToolsComponent';
import { styled } from '@mui/material/styles';
import { ITabInfo } from '../../background/background';

const StyledIconButton = styled(IconButton)<IconButtonProps>(({ theme }) => ({
  flexDirection: 'column',
  backgroundColor: '#ecf3f5',
  color: '#0096FF',
  fontSize: '25px',
  width: '72px',
  height: '52px',
  textAlign: 'center',
  lineHeight: '1.6',
  border: '2px solid #F99B0C',
  borderRadius: '10%',
}));

const StyledTypo = styled(Typography)<TypographyProps>(({ theme }) => ({
  fontSize: '15px',
  color: '#000000',
}));

export const Popup = (): JSX.Element => {
  const [googleAdManager, setGamDetails] = useState<IGoogleAdManagerDetails>();
  const [tcf, setTcfDetails] = useState<ITcfDetails>();
  const [prebid, setPrebidDetails] = useState<IPrebidDetails>();

  useEffect(() => {
    appHandler.getGamDetailsFromBackground((data: IGoogleAdManagerDetails) => {
      logger.log('[App] received Google AdManager Details from background', data);
      setGamDetails((previousData) => {
        return JSON.stringify(previousData) === JSON.stringify(data) ? previousData : data;
      });
    });
    appHandler.getPrebidDetailsFromBackground((data: IPrebidDetails) => {
      logger.log('[App] received Prebid Details from background', data);
      setPrebidDetails((previousData) => {
        return JSON.stringify(previousData) === JSON.stringify(data) ? previousData : data;
      });
    });
    appHandler.getTcfDetailsFromBackground((data: ITcfDetails) => {
      logger.log('[App] received Prebid Details from background', data);
      setTcfDetails((previousData) => {
        return JSON.stringify(previousData) === JSON.stringify(data) ? previousData : data;
      });
    });
  }, []); // get states on mount in case there is no more update when pop up is opened

  useEffect(() => {
    appHandler.handlePopUpUpdate((data: ITabInfo) => {
      logger.log('[App] received update message from background', data);
      const { prebid, tcf, googleAdManager } = data;
      if (prebid) {
        setPrebidDetails((previousData) => {
          return JSON.stringify(previousData) === JSON.stringify(prebid) ? previousData : prebid;
        });
      }
      if (tcf) {
        setTcfDetails((previousData) => {
          return JSON.stringify(previousData) === JSON.stringify(tcf) ? previousData : tcf;
        });
      }
      if (googleAdManager) {
        setGamDetails((previousData) => {
          return JSON.stringify(previousData) === JSON.stringify(googleAdManager) ? previousData : googleAdManager;
        });
      }
    });
  }, []); // register event listener for update message from background script

  logger.log(`[PopUp]: render `, tcf, prebid, googleAdManager);
  return (
    <Box className="popup" sx={{ height: '600px', width: '780px', overflowX: 'scroll' }}>
      <Router>
        <AppBar
          position="sticky"
          sx={{
            alignItems: 'center',
            display: 'flex',
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'space-between',
            height: '62px',
            background: '#f5f5f5',
            '& a:link': {
              textDecoration: 'none',
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              flex: 1,
              justifyContent: 'space-evenly',
            }}
          >
            <img src="https://prebid.org/wp-content/uploads/2021/02/Prebid-Logo-RGB-Full-Color-Medium.svg" alt="logo" width="150" height="50" />
            <Link to="/">
              <StyledIconButton size="small">
                <FontAwesomeIcon icon={faAd} />
                <StyledTypo>Ad Units</StyledTypo>
              </StyledIconButton>
            </Link>

            <Link to="/bids">
              <StyledIconButton size="small">
                <FontAwesomeIcon icon={faCoins} />
                <StyledTypo>Bids</StyledTypo>
              </StyledIconButton>
            </Link>

            <Link to="/timeline">
              <StyledIconButton size="small">
                <FontAwesomeIcon icon={faPollH} />
                <StyledTypo>Timeline</StyledTypo>
              </StyledIconButton>
            </Link>

            <Link to="/config">
              <StyledIconButton size="small">
                <FontAwesomeIcon icon={faSlidersH} />
                <StyledTypo>Config</StyledTypo>
              </StyledIconButton>
            </Link>

            <Link to="/userId">
              <StyledIconButton size="small">
                <FontAwesomeIcon icon={faUserFriends} />
                <StyledTypo>User ID</StyledTypo>
              </StyledIconButton>
            </Link>

            <Link to="/tools">
              <StyledIconButton size="small">
                <FontAwesomeIcon icon={faTools} />
                <StyledTypo>Tools</StyledTypo>
              </StyledIconButton>
            </Link>
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

          <Route path="/config">{prebid?.config && <ConfigComponent prebid={prebid} tcf={tcf}></ConfigComponent>}</Route>

          <Route exact path="/userId">
            {prebid && <UserIdsComponent prebid={prebid}></UserIdsComponent>}
          </Route>

          <Route exact path="/tools">
            {prebid && <ToolsComponent prebid={prebid}></ToolsComponent>}
          </Route>
        </Switch>
      </Router>
    </Box>
  );
};
