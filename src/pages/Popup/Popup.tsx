/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { ITabInfo } from '../Background/background';
import { getTabId } from './utils';
import { ThemeProvider } from '@mui/material/styles';
import AdUnitsComponent from './components/adUnits/AdUnitsComponent';
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
import { popupTheme } from '../theme';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { IconButton } from '@mui/material';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';

const onPbjsNamespaceChange = async (pbjsNamespace: string) => {
  const tabId = await getTabId();
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

export const Popup = (): JSX.Element => {
  const [activeRoute, setActiveRoute] = useState<string>(window.location.hash.replace('#', '') || '/');
  const [pbjsNamespaceDialogOpen, setPbjsNamespaceDialogOpen] = React.useState(false);
  const [pbjsNameSpace, setPbjsNamespace] = React.useState<string>(null);
  const [tabInfo, setTabInfo] = useState<ITabInfo>({});
  const [downloading, setDownloading] = useState<'true' | 'false' | 'error'>('false');
  const timer = React.useRef<ReturnType<typeof setTimeout>>(null);

  const fetchEvents = async (url: string) => {
    try {
      setDownloading('true');
      const response = await fetch(url);
      const json = await response.json();
      if (timer) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => {
        setDownloading('false');
      }, 1000);
      return json;
    } catch (error) {
      setDownloading('error');
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
          prebid.events = await fetchEvents(prebid.eventsUrl);
        }
      }
    }
    setTabInfo(newTabInfo);
  };

  const refresh = async () => {
    const tabId = await getTabId();
    await chrome.tabs.reload(tabId);
    await initialLoad(setPbjsNamespace, setTabInfo);
  };

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
      if (changes.tabInfos) {
        const newTabInfo = changes.tabInfos.newValue[tabId] as ITabInfo;
        const prebids = newTabInfo?.prebids;
        if (prebids) {
          for (const [_, prebid] of Object.entries(prebids)) {
            const events = await fetchEvents(prebid.eventsUrl);
            if (events.length > 0) {
              prebid.events = events;
            }
          }
        }
        setTabInfo(newTabInfo);
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    initialLoad(setPbjsNamespace, setTabInfo);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      clearTimeout(timer.current);
    };
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider theme={popupTheme}>
        <Box sx={{ height: 600, overflowX: 'auto', backgroundColor: 'primary.light' }}>
          <AppBar
            sx={{
              p: 1,
              position: 'relative',
              backgroundColor: 'background.paper',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              '&> a  ': { textDecoration: 'none' },
            }}
          >
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
            <Link to="bids">
              <Button
                size="small"
                variant={activeRoute === '/bids' ? 'contained' : 'outlined'}
                onClick={() => handleRouteChange('/bids')}
                startIcon={<AccountBalanceOutlinedIcon />}
              >
                Bids
              </Button>
            </Link>
            <Link to="timeline">
              <Button
                size="small"
                variant={activeRoute === '/timeline' ? 'contained' : 'outlined'}
                onClick={() => handleRouteChange('/timeline')}
                startIcon={<TimelineOutlinedIcon />}
              >
                Timeline
              </Button>
            </Link>
            <Link to="config">
              <Button
                size="small"
                variant={activeRoute === '/config' ? 'contained' : 'outlined'}
                onClick={() => handleRouteChange('/config')}
                startIcon={<SettingsOutlinedIcon />}
              >
                Config
              </Button>
            </Link>
            <Link to="userId">
              <Button
                size="small"
                variant={activeRoute === '/userId' ? 'contained' : 'outlined'}
                onClick={() => handleRouteChange('/userId')}
                startIcon={<ContactPageOutlinedIcon />}
              >
                UserID
              </Button>
            </Link>
            <Link to="tools">
              <Button
                size="small"
                variant={activeRoute === '/tools' ? 'contained' : 'outlined'}
                onClick={() => handleRouteChange('/tools')}
                startIcon={<DnsOutlinedIcon />}
              >
                Tools
              </Button>
            </Link>
            <IconButton
              aria-label="refresh"
              color="default"
              sx={{ p: 0 }}
              onClick={() => chrome.tabs.create({ url: 'https://github.com/prebid/professor-prebid/issues' })}
            >
              <HelpOutlineOutlinedIcon />
            </IconButton>
            <IconButton
              sx={{ p: 0 }}
              aria-label="refresh"
              onClick={refresh}
              color={downloading === 'true' ? 'primary' : downloading === 'error' ? 'error' : 'default'}
            >
              {downloading === 'true' ? (
                <AutorenewIcon
                  sx={{
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': {
                      '0%': {
                        transform: 'rotate(-390deg)',
                      },
                      '100%': {
                        transform: 'rotate(-30deg)',
                      },
                    },
                  }}
                />
              ) : downloading === 'error' ? (
                <ErrorOutlineIcon />
              ) : (
                <RefreshIcon />
              )}
            </IconButton>
          </AppBar>
          {(!tabInfo?.prebids || !tabInfo?.prebids[pbjsNameSpace]) && (
            <Card onClick={refresh}>
              <CardContent sx={{ backgroundColor: 'primary.light' }}>
                <Grid container justifyContent="center">
                  <Grid item>
                    <Paper elevation={4} sx={{ p: 2 }}>
                      <Typography variant="h2">No Prebid.js detected on this page. Try to scroll down or click here to refresh the page.</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
          <Routes>
            <Route
              path="/"
              element={tabInfo?.prebids && tabInfo.prebids[pbjsNameSpace] && <AdUnitsComponent prebid={tabInfo.prebids[pbjsNameSpace]} />}
            />
            <Route
              path="/popup.html"
              element={tabInfo?.prebids && tabInfo.prebids[pbjsNameSpace] && <AdUnitsComponent prebid={tabInfo.prebids[pbjsNameSpace]} />}
            />
            <Route
              path="bids"
              element={
                <React.Fragment>
                  {tabInfo?.prebids && tabInfo.prebids[pbjsNameSpace] && <BidsComponent prebid={tabInfo.prebids[pbjsNameSpace]} />}
                </React.Fragment>
              }
            ></Route>
            <Route
              path="timeline"
              element={
                <React.Fragment>
                  {tabInfo?.prebids && tabInfo.prebids[pbjsNameSpace] && <TimelineComponent prebid={tabInfo.prebids[pbjsNameSpace]} />}
                </React.Fragment>
              }
            ></Route>
            <Route
              path="config"
              element={
                <React.Fragment>
                  {tabInfo?.prebids && tabInfo.prebids[pbjsNameSpace]?.config && (
                    <ConfigComponent prebid={tabInfo.prebids[pbjsNameSpace]} tcf={tabInfo?.tcf} />
                  )}
                </React.Fragment>
              }
            ></Route>
            <Route
              path="userId"
              element={
                <React.Fragment>
                  {tabInfo?.prebids && tabInfo.prebids[pbjsNameSpace] && <UserIdsComponent prebid={tabInfo.prebids[pbjsNameSpace]} />}
                </React.Fragment>
              }
            ></Route>
            <Route
              path="tools"
              element={
                <React.Fragment>
                  {tabInfo?.prebids && tabInfo.prebids[pbjsNameSpace] && <ToolsComponent prebid={tabInfo?.prebids[pbjsNameSpace]} />}
                </React.Fragment>
              }
            ></Route>
          </Routes>
        </Box>
      </ThemeProvider>
    </BrowserRouter>
  );
};
