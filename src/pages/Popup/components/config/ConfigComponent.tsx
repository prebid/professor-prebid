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
  console.log(`[PopUp][BidderSettingsComponent]: render `, prebid.config, tcf);
  return (
    <Grid container spacing={1} padding={1}>
      {prebid.config && <PriceGranularityCard prebid={prebid} />}
      {prebid.config && <BidderSettingsComponent prebid={prebid} />}
      {prebid.config.s2sConfig && Array.isArray(prebid.config.s2sConfig)
        ? prebid.config.s2sConfig.map((s2sConfig, index) => <Server2ServerComponent s2sConfig={s2sConfig} key={index} />)
        : prebid.config.s2sConfig && <Server2ServerComponent s2sConfig={prebid.config.s2sConfig} />}
      {prebid?.config?.consentManagement && tcf && <ConsentManagementComponent prebid={prebid} tcf={tcf} />}
      {prebid.config?.userSync?.userIds && prebid.config?.userSync?.userIds[0] && <UserIdModule prebid={prebid} />}
      {/* {prebid.config && <AnalyticsComponent prebid={prebid}></AnalyticsComponent>} */}
    </Grid>
  );
};

interface IConfigComponentProps {
  prebid: IPrebidDetails;
  tcf: ITcfDetails;
}

export default ConfigComponent;
