import React from 'react';
import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import { PriceGranularityCard } from './PriceGranularityComponent';
import UserIdModule from './UserIdModule';
import Server2ServerComponent from './Server2ServerComponent';
import AnalyticsComponent from './AnalyticsComponent';
import ConsentManagementComponent from './ConsentManagementComponent';
import BidderSettingsComponent from './BidderSettingsComponent';
import { ITcfDetails } from '../../../../inject/scripts/tcf';
import logger from '../../../../logger';
import Grid from '@mui/material/Grid';
export const tileHeight = 255;


const ConfigComponent = ({ prebid, tcf }: IConfigComponentProps): JSX.Element => {
  logger.log(`[PopUp][BidderSettingsComponent]: render `);
  return (
    <Grid container spacing={1} padding={1}>
      {prebid.config && <PriceGranularityCard prebid={prebid} />}
      {prebid.config && <BidderSettingsComponent prebid={prebid}></BidderSettingsComponent>}
      {prebid.config.s2sConfig && <Server2ServerComponent prebid={prebid}></Server2ServerComponent>}
      {prebid?.config?.consentManagement && tcf && <ConsentManagementComponent prebid={prebid} tcf={tcf}></ConsentManagementComponent>}
      {prebid.config?.userSync?.userIds && prebid.config?.userSync?.userIds[0] && <UserIdModule prebid={prebid}></UserIdModule>}
      {/* {prebid.config && <AnalyticsComponent prebid={prebid}></AnalyticsComponent>} */}
    </Grid>
  );
};

interface IConfigComponentProps {
  prebid: IPrebidDetails;
  tcf: ITcfDetails;
}

export default ConfigComponent;
