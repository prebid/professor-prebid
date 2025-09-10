import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import { ErrorBoundary } from 'react-error-boundary';
import PriceGranularityComponent from './tiles/PriceGranularityComponent';
import UserIdModule from './tiles/UserIdModule';
import PrebidServerComponent from './tiles/PrebidServerComponent';
import PrivacyComponent from './tiles/PrivacyComponent';
import BidderSettingsComponent from './tiles/BidderSettingsComponent';
import PrebidConfigComponent from '../../../Popup/components/config/PrebidConfigComponent';
import FloorsModuleComponent from './tiles/FloorsModuleComponent';
import GptPreAuctionComponent from './tiles/GptPreAuctionComponent';
import InstalledModulesComponent from './tiles/InstalledModules';
import UserSyncComponent from './tiles/UserSyncComponent';

export const tileHeight = 255;

const ConfigComponent = (): JSX.Element => {
  const tiles = [InstalledModulesComponent, PriceGranularityComponent, PrebidConfigComponent, BidderSettingsComponent, PrebidServerComponent, PrivacyComponent, UserIdModule, FloorsModuleComponent, GptPreAuctionComponent, UserSyncComponent];

  return (
    <Grid container>
      {tiles.map((Tile, index) => (
        <ErrorBoundary key={index} FallbackComponent={ErrorFallback}>
          <Tile />
        </ErrorBoundary>
      ))}
    </Grid>
  );
};

export default ConfigComponent;

const ErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ error, resetErrorBoundary }) => {
  const [delayElapsed, setDelayElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      resetErrorBoundary();
      setDelayElapsed(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resetErrorBoundary]);

  return (
    <div style={{ padding: '8px', color: 'red' }}>
      <p>An error occurred: {error.message}</p>
      {delayElapsed && <p>Resetting...</p>}
    </div>
  );
};
