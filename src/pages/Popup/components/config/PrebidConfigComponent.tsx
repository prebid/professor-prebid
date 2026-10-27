import React, { useContext, useState } from 'react';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import CodeIcon from '@mui/icons-material/Code';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import AppStateContext from '../../../Shared/contexts/appStateContext';
import { ExpandableTile } from '../../../Shared/components/config/tiles/ExpandableTile';
import JSONViewerComponent from '../../../Shared/components/JSONViewerComponent';

const PrebidConfigComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const [showJson, setShowJson] = useState(false);
  const config = prebid?.config;

  if (!config) return null;

  const jsonToggleAction = (
    <Tooltip title={showJson ? 'Switch to formatted view' : 'Switch to raw JSON view'} arrow>
      <IconButton size="small" onClick={() => setShowJson(!showJson)} color={showJson ? 'primary' : 'default'} sx={{ mr: 0.5 }}>
        <CodeIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

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
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
            Core Timing & Sequence
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.25 }}>
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
          </Box>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
            Flags & Cache
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
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
          </Box>
        </Grid>
      )}
    </ExpandableTile>
  );
};

export default PrebidConfigComponent;
