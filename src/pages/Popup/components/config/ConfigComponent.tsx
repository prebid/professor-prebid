import React from 'react';
import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import { PriceGranularityCard } from './PriceGranularityComponent';
import UserIdModule from './UserIdModule';
import ConsentModulesGdprComponent from './ConsentModulesGdprComponent';
import Server2ServerComponent from './Server2ServerComponent';
import AnalyticsComponent from './AnalyticsComponent';
import PrivacyComponent from './ConsentManagementComponent';
import BidderSettingsComponent from './BidderSettingsComponent';
import { ITcfDetails } from '../../../../inject/scripts/tcf';
import logger from '../../../../logger';
import Grid from '@mui/material/Grid';
export const tileHeight = 220;


const ConfigComponent = ({ prebid, tcf }: IConfigComponentProps): JSX.Element => {
  logger.log(`[PopUp][BidderSettingsComponent]: render `);
  return (
    <Grid container spacing={1} padding={1}>
      {prebid.config && <PriceGranularityCard prebid={prebid} />}
      {prebid.config && <BidderSettingsComponent prebid={prebid}></BidderSettingsComponent>}
      {prebid.config.s2sConfig && <Server2ServerComponent prebid={prebid}></Server2ServerComponent>}
      {prebid?.config?.consentManagement && tcf && <PrivacyComponent prebid={prebid} tcf={tcf}></PrivacyComponent>}
      {/* {prebid?.config?.consentManagement?.gdpr && <ConsentModulesGdprComponent prebid={prebid}></ConsentModulesGdprComponent>} */}
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
