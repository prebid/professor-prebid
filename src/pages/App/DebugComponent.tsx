import React, { useCallback, useEffect, useState } from 'react';
import UserIdsComponent from '../Popup/components/userIds/UserIdsComponent';
import PrebidAdUnitsComponent from '../Popup/components/adUnits/AdUnitsComponent';
import GoogleAdManagerDetailsComponent from '../Popup/components/googleAdmanager/GoogleAdManagerDetailsComponent';
import TimeLineComponent from '../Popup/components/timeline/TimeLineComponent';
import { IPrebidDetails } from '../../inject/scripts/prebid';
import { ITcfDetails } from '../../inject/scripts/tcf';
import { IGoogleAdManagerDetails } from '../../inject/scripts/googleAdManager';
import BidsComponent from '../Popup/components/bids/BidsComponent';
import ConfigComponent from '../Popup/components/config/ConfigComponent';
import { appHandler } from './appHandler';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const DebugComponent = () => {
  const [debugData, setDebugData] = useState<IDebugData[]>([]);

  useEffect(() => {
    appHandler.getDebugDetailsFromBackground((data: IDebugData[]) => {
      data && setDebugData(data);
    });
  });

  return (
    <Box>
      {debugData &&
        Object.keys(debugData)[0] &&
        Object.keys(debugData).map((key: any) => {
          const { prebid, tcf, gam } = debugData[key];

          return (
            <Box key={key}>
              <Typography>Debug Data for Tab {key} </Typography>
              <Typography>Prebid Details</Typography>
              {prebid && <PrebidAdUnitsComponent prebid={prebid}></PrebidAdUnitsComponent>}
              {prebid && <BidsComponent prebid={prebid}></BidsComponent>}
              {prebid && <TimeLineComponent prebid={prebid}></TimeLineComponent>}
              {prebid?.config && <ConfigComponent prebid={prebid} tcf={tcf}></ConfigComponent>}
              <Typography>IAB TCF Details</Typography>
              {prebid && <UserIdsComponent prebid={prebid}></UserIdsComponent>}
              <Typography>GAM Details</Typography>
              {gam && <GoogleAdManagerDetailsComponent googleAdManager={gam}></GoogleAdManagerDetailsComponent>}
            </Box>
          );
        })}
    </Box>
  );
};

interface IDebugData {
  prebid: IPrebidDetails;
  tcf: ITcfDetails;
  gam: IGoogleAdManagerDetails;
}

export default DebugComponent;
