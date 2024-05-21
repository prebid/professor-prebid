import React, { useState } from 'react';
import PriceGranularityComponent from './tiles/PriceGranularityComponent';
import UserIdModule from './tiles/UserIdModule';
import PrebidServerComponent from './tiles/PrebidServerComponent';
import PrivacyComponent from './tiles/PrivacyComponent';
import BidderSettingsComponent from './tiles/BidderSettingsComponent';
import PrebidConfigComponent from '../../../Popup/components/config/PrebidConfigComponent';
import FloorsModuleComponent from './tiles/FloorsModuleComponent';
import GptPreAuctionComponent from './tiles/GptPreAuctionComponent';
import FledgeForGPTComponent from './tiles/FledgeForGPTComponent';
import Grid from '@mui/material/Grid';
import { ErrorBoundary } from 'react-error-boundary';
import PaapiComponent from './tiles/PaapiComponent';
import InstalledModulesComponent from './tiles/InstalledModules';

export const tileHeight = 255;

const ConfigComponent = (): JSX.Element => {
  return (
    <Grid container spacing={0.25} padding={0.5}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <InstalledModulesComponent />
      </ErrorBoundary>

      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <PriceGranularityComponent />
      </ErrorBoundary>

      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <PrebidConfigComponent />
      </ErrorBoundary>

      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <BidderSettingsComponent />
      </ErrorBoundary>

      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <PrebidServerComponent />
      </ErrorBoundary>

      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <PrivacyComponent />
      </ErrorBoundary>

      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <UserIdModule />
      </ErrorBoundary>

      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <FloorsModuleComponent />
      </ErrorBoundary>

      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <GptPreAuctionComponent />
      </ErrorBoundary>

      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <FledgeForGPTComponent />
      </ErrorBoundary>

      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <PaapiComponent />
      </ErrorBoundary>
    </Grid>
  );
};
export default ConfigComponent;

const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ error, resetErrorBoundary }) => {
  // Use state to track whether the delay has elapsed
  const [delayElapsed, setDelayElapsed] = useState(false);

  // Reset the error boundary after the delay
  setTimeout(() => {
    resetErrorBoundary();
    setDelayElapsed(true);
  }, 1000);

  return (
    <div>
      <p>An error occurred: {error.message}</p>
      {delayElapsed && <p>Resetting...</p>}
    </div>
  );
};
