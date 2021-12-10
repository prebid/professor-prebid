import React, { useCallback, useEffect, useState } from 'react';
import UserIdsComponent from '../Popup/components/userIds/UserIdsComponent';
import PrebidAdUnitsComponent from '../Popup/components/adUnits/AdUnitsComponent';
import GoogleAdManagerDetailsComponent from '../Popup/components/googleAdmanager/GoogleAdManagerDetailsComponent';
import TimeLineComponent from '../Popup/components/timeline/TimeLineComponent';
import { IPrebidDetails } from '../../inject/scripts/prebid';
import { IPrebids } from '../../background/background';
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
          const { prebids, tcf, gam } = debugData[key];

          return (
            <Box key={key}>
              <Typography>Debug Data for Tab {key} </Typography>
              <Typography>Prebid Details</Typography>
              {prebids && Object.keys(prebids).map((prebidKey: string) => {
                const prebid = prebids[prebidKey];
                return (
                  <Box key={prebidKey}>
                    <Typography>Prebid {prebidKey}</Typography>
                    <PrebidAdUnitsComponent prebid={prebid}></PrebidAdUnitsComponent>
                    <BidsComponent prebid={prebid}></BidsComponent>
                    <TimeLineComponent prebid={prebid}></TimeLineComponent>
                    <ConfigComponent prebid={prebid} tcf={tcf}></ConfigComponent>
                    <UserIdsComponent prebid={prebid}></UserIdsComponent>
                  </Box>
                );
              })}
              {gam && <GoogleAdManagerDetailsComponent googleAdManager={gam}></GoogleAdManagerDetailsComponent>}
            </Box>
          );
        })}
    </Box>
  );
};

interface IDebugData {
  prebids: IPrebids;
  tcf: ITcfDetails;
  gam: IGoogleAdManagerDetails;
}

export default DebugComponent;
