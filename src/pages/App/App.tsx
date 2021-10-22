import React, { useCallback, useEffect, useState } from 'react';
import UserIdsComponent from './components/userIds/TcfDetailsComponent';
import PrebidAdUnitsComponent from './components/adUnits/AdUnitsComponent';
import GoogleAdManagerDetailsComponent from './components/GoogleAdManagerDetailsComponent';
import TimeLineComponent from './components/timeline/TimeLineComponent';
import { IPrebidDetails } from '../../inject/scripts/prebid';
import { ITcfDetails } from '../../inject/scripts/tcf';
import { IGoogleAdManagerDetails } from '../../inject/scripts/googleAdManager';
import { appHandler } from '../App/appHandler';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';


const App = () => {
  const [debugData, setDebugData] = useState<IDebugData[]>([]);

  useEffect(() => {
    appHandler.getDebugDetailsFromBackground((data: IDebugData[]) => {
      data && setDebugData(data)
    });
  });

  return (
    <Box>
      {debugData && Object.keys(debugData)[0] && Object.keys(debugData).map((key: any) => {
        const { prebidDetails, tcfDetails, gamDetails } = debugData[key];

        return (
          <Box key={key}>
            <Typography>Debug Data for Tab {key} </Typography>
            <Typography>Prebid Details</Typography>
            {prebidDetails && <TimeLineComponent prebid={prebidDetails}></TimeLineComponent>}
            {prebidDetails && <PrebidAdUnitsComponent prebid={prebidDetails}></PrebidAdUnitsComponent>}
            <Typography>IAB TCF Details</Typography>
            {tcfDetails && <UserIdsComponent prebid={prebidDetails}></UserIdsComponent>}
            <Typography>GAM Details</Typography>
            {gamDetails && <GoogleAdManagerDetailsComponent googleAdManager={gamDetails}></GoogleAdManagerDetailsComponent>}
          </Box>
        )
      })}
    </Box >);
};

interface IDebugData {
  prebidDetails: IPrebidDetails;
  tcfDetails: ITcfDetails;
  gamDetails: IGoogleAdManagerDetails;
}

export default App;
