import React, { useEffect, useState } from 'react';
import UserIdsComponent from '../Popup/components/userIds/UserIdsComponent';
import PrebidAdUnitsComponent from '../Popup/components/adUnits/AdUnitsComponent';
import TimeLineComponent from '../Popup/components/timeline/TimeLineComponent';
import { ITabInfos } from '../Background/background';
import BidsComponent from '../Popup/components/bids/BidsComponent';
import ConfigComponent from '../Popup/components/config/ConfigComponent';
import ToolsComponent from '../Popup/components/tools/ToolsComponent';
import ReactJson from 'react-json-view';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import constants from '../../constants.json';

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

const NamespaceTabs = ({ prebids, megaBytes, tcf }: any) => {
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
      {Object.keys(prebids).map((prebidKey: any, index) => {
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
            </Box>
          </TabPanel>
        );
      })}
    </Box>
  );
};

const ChromeTabs = ({ tabInfos }: any) => {
  const [muiTabId, setMuiTabId] = useState(0);
  const handleMuiTabIdChange = (event: React.SyntheticEvent, newValue: number) => {
    setMuiTabId(newValue);
  };
  return (
    <React.Fragment>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={muiTabId} onChange={handleMuiTabIdChange} aria-label="basic tabs example">
          {Object.keys(tabInfos).map((key: any, index) => {
            return <Tab key={index} label={`${tabInfos[key].url} (TabId: ${key})`} {...a11yProps(index)} />;
          })}
          <Tab label={'JSON id:' + Object.keys(tabInfos).length} {...a11yProps(Object.keys(tabInfos).length)} />
        </Tabs>
      </Box>
      {Object.keys(tabInfos).map((key: any, index) => {
        const { prebids, tcf, googleAdManager } = tabInfos[key];
        const size = new TextEncoder().encode(JSON.stringify(tabInfos[key])).length;
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

const DebugComponent = () => {
  const [tabInfos, setTabInfos] = useState<ITabInfos>(null);
  useEffect(() => {
    const handleMessage = async (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
      if (message.type === constants.EVENTS.EVENT_SEND_AUCTION_DATA_TO_POPUP) {
        const tabInfos = await getTabInfosFromStorage();
        setTabInfos(tabInfos);
      }
    };
    const loadInitialData = async () => {
      const tabInfos = await getTabInfosFromStorage();
      setTabInfos(tabInfos);
    };
    chrome.runtime.onMessage.addListener(handleMessage);
    loadInitialData();
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  return tabInfos && <ChromeTabs tabInfos={tabInfos}></ChromeTabs>;
};

export default DebugComponent;
