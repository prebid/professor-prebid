import React, { useEffect, useState } from 'react';
import UserIdsComponent from '../Popup/components/userIds/UserIdsComponent';
import PrebidAdUnitsComponent from '../Popup/components/adUnits/AdUnitsComponent';
import TimeLineComponent from '../Popup/components/timeline/TimeLineComponent';
import { ITabInfos, ITabInfo } from '../Background/background';
import BidsComponent from '../Popup/components/bids/BidsComponent';
import ConfigComponent from '../Popup/components/config/ConfigComponent';
import ToolsComponent from '../Popup/components/tools/ToolsComponent';
import ReactJson from 'react-json-view';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';

const a11yProps = (index: number) => ({
  id: `simple-tab-${index}`,
  'aria-controls': `simple-tabpanel-${index}`,
});
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

interface NamespaceTabsProps {
  prebids: ITabInfo['prebids'];
  megaBytes: string;
  tcf: ITabInfo['tcf'];
}

const NamespaceTabs = ({ prebids, megaBytes, tcf }: NamespaceTabsProps) => {
  const [muiTabId, setMuiTabId] = useState(0);
  const handleMuiTabIdChange = (event: React.SyntheticEvent, newValue: number) => {
    setMuiTabId(newValue);
  };
  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={muiTabId} onChange={handleMuiTabIdChange} aria-label="basic tabs example">
          {Object.keys(prebids).map((prebidKey: string, index: number) => (
            <Tab label={prebidKey} {...a11yProps(0)} key={index} />
          ))}
        </Tabs>
      </Box>
      {Object.keys(prebids).map((prebidKey: string, index) => {
        const prebid = prebids[prebidKey];
        return (
          <TabPanel value={muiTabId} index={index} key={index}>
            <Box key={prebidKey}>
              <Typography>
                Prebid ({prebidKey}) {megaBytes}MB
              </Typography>
              <ToolsComponent prebid={prebid}></ToolsComponent>
              <PrebidAdUnitsComponent prebid={prebid}></PrebidAdUnitsComponent>
              <BidsComponent prebid={prebid}></BidsComponent>
              <TimeLineComponent prebid={prebid}></TimeLineComponent>
              <ConfigComponent prebid={prebid} tcf={tcf}></ConfigComponent>
              <UserIdsComponent prebid={prebid}></UserIdsComponent>
              <Typography component="div" variant="body1">
                <Box sx={{ color: 'primary.main' }}>primary.main</Box>
                <Box sx={{ color: 'secondary.main' }}>secondary.main</Box>
                <Box sx={{ color: 'error.main' }}>error.main</Box>
                <Box sx={{ color: 'warning.main' }}>warning.main</Box>
                <Box sx={{ color: 'info.main' }}>info.main</Box>
                <Box sx={{ color: 'success.main' }}>success.main</Box>
                <Box sx={{ color: 'text.primary' }}>text.primary</Box>
                <Box sx={{ color: 'text.secondary' }}>text.secondary</Box>
                <Box sx={{ color: 'text.disabled' }}>text.disabled</Box>
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', p: 2 }}>primary.main</Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', p: 2 }}>primary.light</Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box
                    sx={{
                      bgcolor: 'secondary.main',
                      color: 'secondary.contrastText',
                      p: 2,
                    }}
                  >
                    secondary.main
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ bgcolor: 'error.main', color: 'error.contrastText', p: 2 }}>error.main</Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ bgcolor: 'warning.main', color: 'warning.contrastText', p: 2 }}>warning.main</Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ bgcolor: 'info.main', color: 'info.contrastText', p: 2 }}>info.main</Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ bgcolor: 'success.main', color: 'success.contrastText', p: 2 }}>success.main</Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ bgcolor: 'text.primary', color: 'background.paper', p: 2 }}>text.primary</Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ bgcolor: 'text.secondary', color: 'background.paper', p: 2 }}>text.secondary</Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ bgcolor: 'text.disabled', color: 'background.paper', p: 2 }}>text.disabled</Box>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>
        );
      })}
    </Box>
  );
};

const ChromeTabs = ({ tabInfos }: { tabInfos: ITabInfos }) => {
  const [muiTabId, setMuiTabId] = useState(0);
  const handleMuiTabIdChange = (event: React.SyntheticEvent, newValue: number) => {
    setMuiTabId(newValue);
  };
  return (
    <React.Fragment>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={muiTabId} onChange={handleMuiTabIdChange} aria-label="basic tabs example">
          {Object.keys(tabInfos).map((key, index) => {
            return <Tab key={index} label={`${tabInfos[Number(key)].url} (TabId: ${key})`} {...a11yProps(index)} />;
          })}
          <Tab label={'JSON id:' + Object.keys(tabInfos).length} {...a11yProps(Object.keys(tabInfos).length)} />
        </Tabs>
      </Box>
      {Object.keys(tabInfos).map((key, index) => {
        const { prebids, tcf, googleAdManager } = tabInfos[Number(key)];
        const size = new TextEncoder().encode(JSON.stringify(tabInfos[Number(key)])).length;
        const kiloBytes = size / 1024;
        const megaBytes = (kiloBytes / 1024).toFixed(2);
        return (
          <TabPanel value={muiTabId} index={index} key={index}>
            <Box key={key}>{prebids && <NamespaceTabs prebids={prebids} megaBytes={megaBytes} tcf={tcf}></NamespaceTabs>}</Box>
          </TabPanel>
        );
      })}
      <TabPanel value={muiTabId} index={Object.keys(tabInfos).length} key="JSON">
        <ReactJson
          src={tabInfos}
          name={false}
          collapsed={2}
          enableClipboard={false}
          displayObjectSize={true}
          displayDataTypes={false}
          sortKeys={false}
          quotesOnKeys={false}
          indentWidth={2}
          collapseStringsAfterLength={100}
          style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
        />
      </TabPanel>
    </React.Fragment>
  );
};

const getTabInfosFromStorage = async () => {
  const { tabInfos } = await chrome.storage.local.get(['tabInfos']);
  return tabInfos;
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
const loadInitialData = async (setTabInfos: Function) => {
  const newTabInfos = await getTabInfosFromStorage();
  for (const [_, newTabInfo] of Object.entries(newTabInfos)) {
    const prebids = (newTabInfo as ITabInfo).prebids;
    if (prebids) {
      for (const [_, prebid] of Object.entries(prebids)) {
        try {
          const events = await fetchEvents(prebid.eventsUrl);
          if (events.length > 0) {
            prebid.events = events;
          }
        } catch (error) {
          setTimeout(loadInitialData, 1000, setTabInfos);
        }
      }
    }
  }
  setTabInfos(newTabInfos);
};
const DebugComponent = () => {
  const [tabInfos, setTabInfos] = useState<ITabInfos>(null);
  useEffect(() => {
    const handleStorageChange = async (
      changes: {
        [key: string]: chrome.storage.StorageChange;
      },
      _areaName: 'sync' | 'local' | 'managed'
    ) => {
      const newTabInfos = changes.tabInfos.newValue;
      for (const [_, newTabInfo] of Object.entries(newTabInfos)) {
        const prebids = (newTabInfo as ITabInfo).prebids;
        if (prebids) {
          for (const [_, prebid] of Object.entries(prebids)) {
            prebid.events = await fetchEvents(prebid.eventsUrl);
          }
        }
      }
      setTabInfos(newTabInfos);
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    loadInitialData(setTabInfos);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  return <ThemeProvider theme={theme}>{tabInfos && <ChromeTabs tabInfos={tabInfos}></ChromeTabs>}</ThemeProvider>;
};

export default DebugComponent;
