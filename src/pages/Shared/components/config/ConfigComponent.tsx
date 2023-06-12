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
import { ErrorBoundary } from 'react-error-boundary';

export const tileHeight = 255;

const ConfigComponent = (): JSX.Element => (
  <Grid container spacing={0.25} padding={0.5}>
    <ErrorBoundary FallbackComponent={Fallback}>
      <PriceGranularityComponent />
    </ErrorBoundary>

    <ErrorBoundary FallbackComponent={Fallback}>
      <PrebidConfigComponent />
    </ErrorBoundary>

    <ErrorBoundary FallbackComponent={Fallback}>
      <BidderSettingsComponent />
    </ErrorBoundary>

    <ErrorBoundary FallbackComponent={Fallback}>
      <PrebidServerComponent />
    </ErrorBoundary>

    <ErrorBoundary FallbackComponent={Fallback}>
      <PrivacyComponent />
    </ErrorBoundary>

    <ErrorBoundary FallbackComponent={Fallback}>
      <UserIdModule />
    </ErrorBoundary>

    <ErrorBoundary FallbackComponent={Fallback}>
      <FloorsModuleComponent />
    </ErrorBoundary>

    <ErrorBoundary FallbackComponent={Fallback}>
      <GptPreAuctionComponent />
    </ErrorBoundary>
  </Grid>
);
export default ConfigComponent;

const Fallback = ({ error }: { error: any }) => {
  return (
    <Grid item sm={4} xs={12}>
      <div role="alert">
        <p>Something went wrong:</p>
        <pre style={{ color: 'red' }}>{error.message}</pre>
      </div>
    </Grid>
  );
};
