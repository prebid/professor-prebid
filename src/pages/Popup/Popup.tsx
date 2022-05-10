/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Route, Link, Switch } from 'react-router-dom';
import { ITabInfo } from '../Background/background';
import { getTabId } from './utils';
import { ThemeProvider } from '@mui/material/styles';
import logger from '../../logger';
import PrebidAdUnitsComponent from './components/adUnits/AdUnitsComponent';
import UserIdsComponent from './components/userIds/UserIdsComponent';
import ConfigComponent from './components/config/ConfigComponent';
import TimelineComponent from './components/timeline/TimeLineComponent';
import BidsComponent from './components/bids/BidsComponent';
import ToolsComponent from './components/tools/ToolsComponent';
import constants from '../../constants.json';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
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
import Badge from '@mui/material/Badge';
import theme from '../theme';

const onPbjsNamespaceChange = async (pbjsNamespace: string) => {
  const tabId = await getTabId();
  logger.log('[PopupHandler] Send pbjsNamespace', { tabId }, { type: constants.PBJS_NAMESPACE_CHANGE, pbjsNamespace });
  chrome.tabs.sendMessage(tabId, { type: constants.PBJS_NAMESPACE_CHANGE, pbjsNamespace });
};

const getNameSpace = (previous: null | string, tabInfo: ITabInfo): string => {
  if (previous === null && tabInfo?.prebids && Object.keys(tabInfo.prebids) && Object.keys(tabInfo.prebids)[0]) {
    onPbjsNamespaceChange(Object.keys(tabInfo.prebids)[0]);
    return Object.keys(tabInfo.prebids)[0];
  } else {
    return previous;
  }
};

const fetchEvents = async (url: string) => {
  try {
    const response = await fetch(url);
    const json = await response.json();
    return json;
  } catch (error) {
    return [];
  }
};

const initialLoad = async (setPbjsNamespace: Function, setTabInfo: Function) => {
  const tabId = await getTabId();
  const { tabInfos } = await chrome.storage.local.get(['tabInfos']);
  const newTabInfo = tabInfos[tabId];
  setPbjsNamespace((previous: string) => getNameSpace(previous, newTabInfo));
  for (const [_, tabInfo] of Object.entries(tabInfos)) {
    const prebids = (tabInfo as ITabInfo).prebids;
    if (prebids) {
      for (const [_, prebid] of Object.entries(prebids)) {
        try {
          const events = await fetchEvents(prebid.eventsUrl);
          if (events.length > 0) {
            prebid.events = events;
          }
        } catch (error) {
          setTimeout(initialLoad, 1000, setPbjsNamespace, setTabInfo);
        }
      }
    }
  }
  setTabInfo(newTabInfo);
};

export const Popup = (): JSX.Element => {
  const [activeRoute, setActiveRoute] = useState<string>(window.location.hash.replace('#', '') || '/');
  const [pbjsNamespaceDialogOpen, setPbjsNamespaceDialogOpen] = React.useState(false);
  const [pbjsNameSpace, setPbjsNamespace] = React.useState<string>(null);
  const [tabInfo, setTabInfo] = useState<ITabInfo>({});

  const handleRouteChange = (input: any) => {
    setActiveRoute(input);
  };

  const handleClose = () => setPbjsNamespaceDialogOpen(false);
  const handleClickOpen = () => setPbjsNamespaceDialogOpen(true);
  const handlePbjsNamespaceChange = (event: SelectChangeEvent) => {
    onPbjsNamespaceChange(event.target.value);
    setPbjsNamespace(event.target.value);
  };

  useEffect(() => {
    setPbjsNamespace((previous) => getNameSpace(previous, tabInfo));
  }, [tabInfo]);

  useEffect(() => {
    const handleStorageChange = async (changes: { [key: string]: chrome.storage.StorageChange }, _areaName: string) => {
      const tabId = await getTabId();
      const newTabInfo = changes.tabInfos.newValue[tabId] as ITabInfo;
      const prebids = newTabInfo.prebids;
      if (prebids) {
        for (const [_, prebid] of Object.entries(prebids)) {
          const events = await fetchEvents(prebid.eventsUrl);
          if (events.length > 0) {
            prebid.events = events;
          }
        }
      }
      setTabInfo(newTabInfo);
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    initialLoad(setPbjsNamespace, setTabInfo);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  logger.log(`[PopUp]: render `, tabInfo?.prebids, tabInfo, pbjsNameSpace);
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ height: 600, overflowX: 'auto', backgroundColor: 'primary.light', opacity: 0.7 }}>
        <Router>
          <AppBar sx={{ p: 1, position: 'relative', backgroundColor: 'background.paper' }}>
            <Stack sx={{ justifyContent: 'center', flexWrap: 'wrap', gap: 1, '&> a  ': { textDecoration: 'none' } }} direction="row">
              <Badge
                invisible={tabInfo?.prebids && Object.keys(tabInfo.prebids).length < 2}
                badgeContent={(tabInfo?.prebids && Object.keys(tabInfo.prebids).length) || null}
                color="primary"
                sx={{ width: '14%' }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                onClick={handleClickOpen}
              >
                <img src="https://prebid.org/wp-content/uploads/2021/02/Prebid-Logo-RGB-Full-Color-Medium.svg" width={'100%'} alt="prebid logo" />
              </Badge>
              {tabInfo?.prebids && (
                <Dialog disableEscapeKeyDown open={pbjsNamespaceDialogOpen} onClose={handleClose}>
                  <DialogTitle>Select Prebid Instance</DialogTitle>
                  <DialogContent>
                    <Box component="form">
                      <FormControl sx={{ m: 1, minWidth: 180 }}>
                        <Select value={pbjsNameSpace || undefined} onChange={handlePbjsNamespaceChange} autoWidth>
                          {Object.keys(tabInfo?.prebids).map((global, index) => (
                            <MenuItem key={index} value={global}>
                              {global}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </DialogContent>
                  <DialogActions sx={{ justifyContent: 'space-around' }}>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleClose}>Ok</Button>
                  </DialogActions>
                </Dialog>
              )}
              <Link to="/">
                <Button
                  size="small"
                  variant={activeRoute === '/' ? 'contained' : 'outlined'}
                  onClick={() => handleRouteChange('/')}
                  startIcon={<AdUnitsOutlinedIcon />}
                >
                  AdUnits
                </Button>
              </Link>
              <Link to="/bids">
                <Button
                  size="small"
                  variant={activeRoute === '/bids' ? 'contained' : 'outlined'}
                  onClick={() => handleRouteChange('/bids')}
                  startIcon={<AccountBalanceOutlinedIcon />}
                >
                  Bids
                </Button>
              </Link>
              <Link to="/timeline">
                <Button
                  size="small"
                  variant={activeRoute === '/timeline' ? 'contained' : 'outlined'}
                  onClick={() => handleRouteChange('/timeline')}
                  startIcon={<TimelineOutlinedIcon />}
                >
                  Timeline
                </Button>
              </Link>
              <Link to="/config">
                <Button
                  size="small"
                  variant={activeRoute === '/config' ? 'contained' : 'outlined'}
                  onClick={() => handleRouteChange('/config')}
                  startIcon={<SettingsOutlinedIcon />}
                >
                  Config
                </Button>
              </Link>
              <Link to="/userId">
                <Button
                  size="small"
                  variant={activeRoute === '/userId' ? 'contained' : 'outlined'}
                  onClick={() => handleRouteChange('/userId')}
                  startIcon={<ContactPageOutlinedIcon />}
                >
                  UserID
                </Button>
              </Link>
              <Link to="/tools">
                <Button
                  size="small"
                  variant={activeRoute === '/tools' ? 'contained' : 'outlined'}
                  onClick={() => handleRouteChange('/tools')}
                  startIcon={<DnsOutlinedIcon />}
                >
                  Tools
                </Button>
              </Link>
            </Stack>
          </AppBar>
          <Switch>
            <Route exact path="/">
              {(!tabInfo?.prebids || !tabInfo?.prebids[pbjsNameSpace]) && (
                <Card
                  onClick={async () => {
                    const tabId = await getTabId();
                    await chrome.tabs.reload(tabId);
                    await initialLoad(setPbjsNamespace, setTabInfo);
                  }}
                >
                  <CardContent sx={{ backgroundColor: 'primary.light', opacity: 0.7 }}>
                    <Grid container justifyContent="center">
                      <Grid item>
                        <Paper elevation={4} sx={{ p: 2 }}>
                          <Typography variant="h2">
                            No Prebid.js detected on this page. Try to scroll down or click here to refresh the page.
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}
              {tabInfo?.prebids && tabInfo.prebids[pbjsNameSpace] && <PrebidAdUnitsComponent prebid={tabInfo.prebids[pbjsNameSpace]} />}
            </Route>
            <Route exact path="/bids">
              {tabInfo?.prebids && tabInfo.prebids[pbjsNameSpace] && <BidsComponent prebid={tabInfo.prebids[pbjsNameSpace]} />}
            </Route>
            <Route exact path="/timeline">
              {tabInfo?.prebids && tabInfo.prebids[pbjsNameSpace] && <TimelineComponent prebid={tabInfo.prebids[pbjsNameSpace]} />}
            </Route>
            <Route exact path="/config">
              {tabInfo?.prebids && tabInfo.prebids[pbjsNameSpace]?.config && (
                <ConfigComponent prebid={tabInfo.prebids[pbjsNameSpace]} tcf={tabInfo?.tcf} />
              )}
            </Route>
            <Route exact path="/userId">
              {tabInfo?.prebids && tabInfo.prebids[pbjsNameSpace] && <UserIdsComponent prebid={tabInfo.prebids[pbjsNameSpace]} />}
            </Route>
            <Route exact path="/tools">
              {tabInfo?.prebids && tabInfo.prebids[pbjsNameSpace] && <ToolsComponent prebid={tabInfo?.prebids[pbjsNameSpace]} />}
            </Route>
          </Switch>
        </Router>
      </Box>
    </ThemeProvider>
  );
};
