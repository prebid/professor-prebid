import React, { useCallback, useEffect, useState } from 'react';
import UserIdsComponent from '../Popup/components/userIds/UserIdsComponent';
import PrebidAdUnitsComponent from '../Popup/components/adUnits/AdUnitsComponent';
import TimeLineComponent from '../Popup/components/timeline/TimeLineComponent';
import { IPrebids, ITabInfos } from '../../background/background';
import { ITcfDetails } from '../../inject/scripts/tcf';
import { IGoogleAdManagerDetails } from '../../inject/scripts/googleAdManager';
import BidsComponent from '../Popup/components/bids/BidsComponent';
import ConfigComponent from '../Popup/components/config/ConfigComponent';
import ToolsComponent from '../Popup/components/tools/ToolsComponent';
import ReactJson from 'react-json-view';

import { appHandler } from './appHandler';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

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

const DebugComponent = () => {
  const [tabInfos, setTabInfos] = useState<ITabInfos>(null);
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const bg = chrome.extension.getBackgroundPage();
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabInfos = bg.tabInfos;
      setTabInfos(tabInfos)
    });
  }, [bg.tabInfos]);

  return (
    <Box>
      <IconButton color="secondary" aria-label="delete backgroundpage data">
        <DeleteIcon />
      </IconButton>
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
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          {tabInfos &&
            Object.keys(tabInfos)[0] &&
            Object.keys(tabInfos).map((key: any, index) => {
              return <Tab key={index} label={`${tabInfos[key].url} (TabId: ${key})`} {...a11yProps(index)} />;
            })}
        </Tabs>
      </Box>
      {tabInfos &&
        Object.keys(tabInfos)[0] &&
        Object.keys(tabInfos).map((key: any, index) => {
          const { prebids, tcf, googleAdManager } = tabInfos[key];
          const size = new TextEncoder().encode(JSON.stringify(tabInfos[key])).length;
          const kiloBytes = size / 1024;
          const megaBytes = (kiloBytes / 1024).toFixed(2);
          return (
            <TabPanel value={value} index={index} key={index}>
              <Box key={key}>
                {prebids &&
                  Object.keys(prebids).map((prebidKey: string) => {
                    const prebid = prebids[prebidKey];
                    return (
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

                        {/* {gam && <GoogleAdManagerDetailsComponent googleAdManager={gam}></GoogleAdManagerDetailsComponent>} */}
                      </Box>
                    );
                  })}
              </Box>
            </TabPanel>
          );
        })}
    </Box>
  );
};

export default DebugComponent;
