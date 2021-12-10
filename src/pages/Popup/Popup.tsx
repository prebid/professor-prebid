import React, { useCallback, useEffect, useState } from 'react';
import { HashRouter as Router, Route, Link, Switch, useLocation } from 'react-router-dom';
// Custom files
import { IGoogleAdManagerDetails } from '../../inject/scripts/googleAdManager';
import { ITcfDetails } from '../../inject/scripts/tcf';
import { IPrebidDetails } from '../../inject/scripts/prebid';
import { IPrebids } from '../../background/background';
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
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';

// Styles
const StyledButton = styled(Button)(({ theme }) => ({
  textDecoration: 'none',
}));
const StyledLink = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
}));

// Functions
export const Popup = (): JSX.Element => {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const handleClose = (event: React.SyntheticEvent<unknown>, reason?: string) => {
    if (reason !== 'backdropClick') {
      setDialogOpen(false);
    }
  };
  const handleClickOpen = () => {
    setDialogOpen(true);
  };
  const [global, setGlobal] = React.useState<string>(null);
  const handleGlobalChange = (event: SelectChangeEvent) => {
    setGlobal(event.target.value as string);
  };
  const [prebids, setPrebids] = useState<IPrebids>();
  const [googleAdManager, setGamDetails] = useState<IGoogleAdManagerDetails>();
  const [tcf, setTcfDetails] = useState<ITcfDetails>();
  const [isActive, setActive] = useState(window.location.hash.replace('#', '') || '/');
  useEffect(() => {
    appHandler.getGamDetailsFromBackground((data: IGoogleAdManagerDetails) => {
      logger.log('[App] received Google AdManager Details from background', data);
      setGamDetails((previousData) => {
        return JSON.stringify(previousData) === JSON.stringify(data) ? previousData : data;
      });
    });
    appHandler.getPrebidDetailsFromBackground((data: IPrebids) => {
      logger.log('[App] received Prebid Details from background', data);
      setPrebids((previousData) => {
        return JSON.stringify(previousData) === JSON.stringify(data) ? previousData : data;
      });
      setGlobal((previous) => {
        return previous === null && data ? Object.keys(data)[0] : previous;
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
      const { prebids, tcf, googleAdManager } = data;
      if (prebids) {
        setPrebids((previousData) => {
          return JSON.stringify(previousData) === JSON.stringify(prebids) ? previousData : prebids;
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

  logger.log(`[PopUp]: render `, tcf, prebids, googleAdManager);

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
              <img src="https://prebid.org/wp-content/uploads/2021/02/Prebid-Logo-RGB-Full-Color-Medium.svg" width="14%" onClick={handleClickOpen} />
              {prebids && (
                <Dialog disableEscapeKeyDown open={dialogOpen} onClose={handleClose}>
                  <DialogTitle>Select Prebid Instance</DialogTitle>
                  <DialogContent>
                    <Box component="form" sx={{ display: 'flex', flexWrap: 'wrap' }}>
                      <FormControl sx={{ m: 1, minWidth: 120 }}>
                        <Select value={global || undefined} onChange={handleGlobalChange} autoWidth>
                          {Object.keys(prebids).map((global, index) => (
                            <MenuItem key={index} value={global}>
                              {global}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleClose}>Ok</Button>
                  </DialogActions>
                </Dialog>
              )}
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
                  startIcon={<DnsOutlinedIcon />}
                >
                  Tools
                </StyledButton>
              </StyledLink>
            </Stack>
          </Box>
        </AppBar>
        <Switch>
          <Route exact path="/">
            {prebids && prebids[global] ? (
              <PrebidAdUnitsComponent prebid={prebids[global]}></PrebidAdUnitsComponent>
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
            {prebids && prebids[global] && <BidsComponent prebid={prebids[global]}></BidsComponent>}
          </Route>
          <Route exact path="/timeline">
            {prebids && prebids[global] && <TimelineComponent prebid={prebids[global]}></TimelineComponent>}
          </Route>
          <Route exact path="/config">
            {prebids && prebids[global]?.config && <ConfigComponent prebid={prebids[global]} tcf={tcf}></ConfigComponent>}
          </Route>
          <Route exact path="/userId">
            {prebids && prebids[global] && <UserIdsComponent prebid={prebids[global]}></UserIdsComponent>}
          </Route>
          <Route exact path="/tools">
            {prebids && prebids[global] && <ToolsComponent prebid={prebids[global]}></ToolsComponent>}
          </Route>
        </Switch>
      </Router>
    </Box>
  );
};
