import React, { useCallback, useEffect, useState } from 'react';
import UserIdsComponent from '../Popup/components/userIds/UserIdsComponent';
import PrebidAdUnitsComponent from '../Popup/components/adUnits/AdUnitsComponent';
import TimeLineComponent from '../Popup/components/timeline/TimeLineComponent';
import { IPrebids } from '../../background/background';
import { ITcfDetails } from '../../inject/scripts/tcf';
import { IGoogleAdManagerDetails } from '../../inject/scripts/googleAdManager';
import BidsComponent from '../Popup/components/bids/BidsComponent';
import ConfigComponent from '../Popup/components/config/ConfigComponent';
import ToolsComponent from '../Popup/components/tools/ToolsComponent';

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
  const [debugData, setDebugData] = useState<IDebugData[]>([]);
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    appHandler.getDebugDetailsFromBackground((data: IDebugData[]) => {
      if (data) {
        setDebugData(data);
      }
    });
    appHandler.handleDebugTabUpdate((data: IDebugData[]) => {
      setDebugData(data);
    });
  }, []);
  console.log(debugData);
  return (
    <Box>
      <IconButton color="secondary" aria-label="delete backgroundpage data">
        <DeleteIcon />
      </IconButton>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          {debugData &&
            Object.keys(debugData)[0] &&
            Object.keys(debugData).map((key: any, index) => {
              return <Tab key={index} label={`${debugData[key].url} (TabId: ${key})`} {...a11yProps(index)} />;
            })}
        </Tabs>
      </Box>
      {debugData &&
        Object.keys(debugData)[0] &&
        Object.keys(debugData).map((key: any, index) => {
          const { prebids, tcf, gam } = debugData[key];
          return (
            <TabPanel value={value} index={index} key={index}>
              <Box key={key}>
                {prebids &&
                  Object.keys(prebids).map((prebidKey: string) => {
                    const prebid = prebids[prebidKey];
                    return (
                      <Box key={prebidKey}>
                        <Typography>Prebid {prebidKey}</Typography>
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

interface IDebugData {
  prebids: IPrebids;
  tcf: ITcfDetails;
  gam: IGoogleAdManagerDetails;
  url: string;
}

export default DebugComponent;
