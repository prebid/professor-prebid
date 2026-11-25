import React, { useContext, useState } from 'react';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import AppStateContext from '../../../Shared/contexts/appStateContext';
import { ExpandableTile } from '../../../Shared/components/config/tiles/ExpandableTile';
import JSONViewerComponent from '../../../Shared/components/JSONViewerComponent';
import { ChipRow, SectionLabel } from '../../../Shared/components/Section';
import { JsonViewToggle } from '../../../Shared/components/JsonViewToggle';

const PrebidConfigComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const [showJson, setShowJson] = useState(false);
  const config = prebid?.config;

  if (!config) return null;

  const jsonToggleAction = <JsonViewToggle active={showJson} onToggle={() => setShowJson(!showJson)} />;

  const bidderTimeout = config.bidderTimeout ? `${config.bidderTimeout}ms` : '3000ms';
  const bidderSequence = config.bidderSequence || 'random';
  const sendAllBids = config.enableSendAllBids !== undefined ? config.enableSendAllBids : true;
  const maxNestedIframes = config.maxNestedIframes ?? 10;
  const useBidCache = config.useBidCache ?? false;
  const deviceAccess = config.deviceAccess;
  const cacheUrl = config.cache?.url;

  return (
    <ExpandableTile icon={<SettingsApplicationsIcon />} title="Prebid Config" subtitle="Timeouts, cache, & core settings" defaultMaxWidth={4} expandedMaxWidth={8} headerAction={jsonToggleAction}>
      {showJson ? (
        <Grid size={{ xs: 12 }}>
          <JSONViewerComponent src={config} name="" collapsed={1} />
        </Grid>
      ) : (
        <Grid size={{ xs: 12 }}>
          <SectionLabel>Core Timing & Sequence</SectionLabel>
          <ChipRow sx={{ mb: 1.25 }}>
            <Chip
              label={
                <>
                  <span>Bidder Timeout: </span>
                  <strong>{bidderTimeout}</strong>
                </>
              }
              size="small"
              color="primary"
              variant="outlined"
              sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
            />
            <Chip
              label={
                <>
                  <span>Bidder Sequence: </span>
                  <strong>{bidderSequence}</strong>
                </>
              }
              size="small"
              color="info"
              variant="outlined"
              sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
            />
            <Chip
              label={
                <>
                  <span>Max Nested Iframes: </span>
                  <strong>{String(maxNestedIframes)}</strong>
                </>
              }
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
            />
          </ChipRow>

          <SectionLabel>Flags & Cache</SectionLabel>
          <ChipRow>
            <Chip
              label={
                <>
                  <span>Send All Bids: </span>
                  <strong>{String(sendAllBids)}</strong>
                </>
              }
              size="small"
              color={sendAllBids ? 'success' : 'default'}
              variant={sendAllBids ? 'filled' : 'outlined'}
              sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
            />
            <Chip
              label={
                <>
                  <span>Use Bid Cache: </span>
                  <strong>{String(useBidCache)}</strong>
                </>
              }
              size="small"
              color={useBidCache ? 'success' : 'default'}
              variant={useBidCache ? 'filled' : 'outlined'}
              sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
            />
            {deviceAccess !== undefined && (
              <Chip
                label={
                  <>
                    <span>Device Access: </span>
                    <strong>{String(deviceAccess)}</strong>
                  </>
                }
                size="small"
                color={deviceAccess ? 'success' : 'warning'}
                variant={deviceAccess ? 'filled' : 'outlined'}
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
              />
            )}
            {cacheUrl && (
              <Chip
                label={
                  <>
                    <span>Bid Cache Url: </span>
                    <strong>{cacheUrl}</strong>
                  </>
                }
                size="small"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500, maxWidth: '100%' }}
              />
            )}
          </ChipRow>
        </Grid>
      )}
    </ExpandableTile>
  );
};

export default PrebidConfigComponent;
