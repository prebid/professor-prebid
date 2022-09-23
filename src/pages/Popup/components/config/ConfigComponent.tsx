import React from 'react';
import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import { PriceGranularityCard } from './PriceGranularityComponent';
import UserIdModule from './UserIdModule';
import Server2ServerComponent from './Server2ServerComponent';
import AnalyticsComponent from './AnalyticsComponent';
import ConsentManagementComponent from './ConsentManagementComponent';
import BidderSettingsComponent from './BidderSettingsComponent';
import PrebidConfigComponent from './PrebidConfigComponent';
import FloorsModuleComponent from './FloorsModuleComponent';
import GptPreAuctionComponent from './GptPreAuctionComponent';
import { ITcfDetails } from '../../../../inject/scripts/tcf';
import Grid from '@mui/material/Grid';
import SearchBarComponent from './SearchBarComponent';
export const tileHeight = 255;

const ConfigComponent = ({ prebid, tcf }: IConfigComponentProps): JSX.Element => {
  return (
    <Grid container spacing={0.25} padding={1}>
      {false && <SearchBarComponent config={prebid.config}></SearchBarComponent>}
      {prebid.config.priceGranularity && (
        <PriceGranularityCard priceGranularity={prebid.config.priceGranularity} customPriceBucket={prebid.config.customPriceBucket} />
      )}

      {prebid.config && <PrebidConfigComponent config={prebid.config} />}
      {prebid.bidderSettings && <BidderSettingsComponent prebid={prebid} />}

      {prebid.config.s2sConfig && Array.isArray(prebid.config.s2sConfig)
        ? prebid.config.s2sConfig.map((s2sConfig, index) => <Server2ServerComponent s2sConfig={s2sConfig} key={index} />)
        : prebid.config.s2sConfig && <Server2ServerComponent s2sConfig={prebid.config.s2sConfig} />}

      {prebid?.config?.consentManagement && tcf && <ConsentManagementComponent consentManagement={prebid.config.consentManagement} tcf={tcf} />}

      {prebid.config?.userSync?.userIds && prebid.config?.userSync?.userIds[0] && <UserIdModule userSync={prebid.config.userSync} />}
      {prebid.config?.floors && <FloorsModuleComponent floors={prebid.config.floors} />}
      {prebid.config?.gptPreAuction && <GptPreAuctionComponent gptPreAuction={prebid.config.gptPreAuction} />}
      {prebid.config && false && <AnalyticsComponent prebid={prebid}></AnalyticsComponent>}
    </Grid>
  );
};

interface IConfigComponentProps {
  prebid: IPrebidDetails;
  tcf: ITcfDetails;
}

export default ConfigComponent;
