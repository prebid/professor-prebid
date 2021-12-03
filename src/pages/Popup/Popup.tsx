import React, { useCallback, useEffect, useState } from 'react';
import { HashRouter as Router, Route, Link, Switch, useLocation } from 'react-router-dom';
// Custom files
import { IGoogleAdManagerDetails } from '../../inject/scripts/googleAdManager';
import { ITcfDetails } from '../../inject/scripts/tcf';
import { IPrebidDetails } from '../../inject/scripts/prebid';
import { appHandler } from '../App/appHandler';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPollH, faSlidersH, faAd, faTools, faCoins, faUserFriends } from '@fortawesome/free-solid-svg-icons';
import logger from '../../logger';
import PrebidAdUnitsComponent from './components/adUnits/AdUnitsComponent';
import UserIdsComponent from './components/userIds/UserIdsComponent';
import ConfigComponent from './components/config/ConfigComponent';
import TimelineComponent from './components/timeline/TimeLineComponent';
import BidsComponent from './components/bids/BidsComponent';
import { popupHandler } from './popupHandler';
import ToolsComponent from './components/tools/ToolsComponent';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { ITabInfo } from '../../background/background';
// Material-UI
import { styled } from '@mui/material/styles';
import Typography, { TypographyProps } from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import AdUnitsOutlinedIcon from '@mui/icons-material/AdUnitsOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
// Styles
const StyledButton = styled(Button)(({ theme }) => ({
  textDecoration: 'none',
}));
const StyledLink = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
}));

// Functions
export const Popup = (): JSX.Element => {
  const [googleAdManager, setGamDetails] = useState<IGoogleAdManagerDetails>();
  const [tcf, setTcfDetails] = useState<ITcfDetails>();
  const [prebid, setPrebidDetails] = useState<IPrebidDetails>();
  const [isActive, setActive] = useState('/');

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
    <Box
      className="popup"
      sx={{
        height: '600px',
        width: '780px',
        overflowX: 'scroll',
        backgroundColor: '#87CEEB',
        opacity: [0.9, 0.8, 0.7],
      }}
    >
      <Router>
        <AppBar
          position="relative"
          sx={{
            background: '#FFF',
            paddingBottom: '1%',
          }}
        >
          <Box
            sx={{
              color: '#4285F4',
              textAlign: 'center',
              paddingTop: '1%',
              //justifyContent: 'center',
              // paddingLeft: '2%',
            }}
          ></Box>
          <Box
            sx={{
              display: 'flex',
              flex: 0.8,
              justifyContent: 'space-around',
            }}
          >
            <Stack sx={{ pl: 2, pr: 10 }} spacing={2} direction="row">
              <img src="https://prebid.org/wp-content/uploads/2021/02/Prebid-Logo-RGB-Full-Color-Medium.svg" width="14%" />
              <StyledLink to="/">
                <StyledButton
                  size="small"
                  variant={isActive === '/' ? 'contained' : 'outlined'}
                  onClick={() => setActive('/')}
                  startIcon={<AdUnitsOutlinedIcon />}
                >
                  AdUnits
                </StyledButton>
              </StyledLink>
              <StyledLink to="/bids">
                <StyledButton
                  size="small"
                  variant={isActive === '/bids' ? 'contained' : 'outlined'}
                  onClick={() => setActive('/bids')}
                  startIcon={<AccountBalanceOutlinedIcon />}
                >
                  Bids
                </StyledButton>
              </StyledLink>
              <StyledLink to="/timeline">
                <StyledButton
                  size="small"
                  variant={isActive === '/timeline' ? 'contained' : 'outlined'}
                  onClick={() => setActive('/timeline')}
                  startIcon={<TimelineOutlinedIcon />}
                >
                  Timeline
                </StyledButton>
              </StyledLink>
              <StyledLink to="/config">
                <StyledButton
                  size="small"
                  variant={isActive === '/config' ? 'contained' : 'outlined'}
                  onClick={() => setActive('/config')}
                  startIcon={<SettingsOutlinedIcon />}
                >
                  Config
                </StyledButton>
              </StyledLink>
              <StyledLink to="/userId">
                <StyledButton
                  size="small"
                  variant={isActive === '/userId' ? 'contained' : 'outlined'}
                  onClick={() => setActive('/userId')}
                  startIcon={<ContactPageOutlinedIcon />}
                >
                  UserID
                </StyledButton>
              </StyledLink>
              <StyledLink to="/tools">
                <StyledButton
                  size="small"
                  variant={isActive === '/tools' ? 'contained' : 'outlined'}
                  onClick={() => setActive('/tools')}
                  startIcon={<DnsOutlinedIcon />} /*onClick={dfp_open_console}*/
                >
                  Tools
                </StyledButton>
              </StyledLink>
            </Stack>
          </Box>
        </AppBar>
        <Switch>
          <Route exact path="/">
            {prebid ? (
              <PrebidAdUnitsComponent prebid={prebid}></PrebidAdUnitsComponent>
            ) : (
              <Card>
                <CardContent sx={{ backgroundColor: '#87CEEB', opacity: 0.8 }}>
                  <Grid container justifyContent="center">
                    <Grid item>
                      <Paper
                        elevation={4}
                        sx={{
                          backgroundColor: '#FFF',
                          width: '105%',
                          height: '120%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          textAlign: 'center',
                        }}
                      >
                        <Typography sx={{ fontSize: '18px', fontWeight: 'bold' }}>
                          There is no Prebid adapter on this page. Scroll down or refresh the page
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
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
