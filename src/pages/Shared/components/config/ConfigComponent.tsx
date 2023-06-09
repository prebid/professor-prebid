import React from 'react';
import PriceGranularityComponent from './tiles/PriceGranularityComponent';
import UserIdModule from './tiles/UserIdModule';
import PrebidServerComponent from './tiles/PrebidServerComponent';
import PrivacyComponent from './tiles/PrivacyComponent';
import BidderSettingsComponent from './tiles/BidderSettingsComponent';
import PrebidConfigComponent from '../../../Popup/components/config/PrebidConfigComponent';
import FloorsModuleComponent from './tiles/FloorsModuleComponent';
import GptPreAuctionComponent from './tiles/GptPreAuctionComponent';
import Grid from '@mui/material/Grid';

export const tileHeight = 255;

const ConfigComponent = (): JSX.Element => (
  <Grid container spacing={0.25} padding={0.5}>
    <PriceGranularityComponent />

    <PrebidConfigComponent />

    <BidderSettingsComponent />

    <PrebidServerComponent />

    <PrivacyComponent />

    <UserIdModule />

    <FloorsModuleComponent />

    <GptPreAuctionComponent />
  </Grid>
);
export default ConfigComponent;
