import React, { useContext, useState } from 'react';
import DnsIcon from '@mui/icons-material/Dns';
import CodeIcon from '@mui/icons-material/Code';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';
import JSONViewerComponent from '../../JSONViewerComponent';
import { Config } from 'prebid.js';

interface RenderPrebidServerComponentProps {
  s2sConfig: Config['s2sConfig'] & Record<string, any>;
  index?: number;
}

const RenderPrebidServerComponent = ({ s2sConfig, index }: RenderPrebidServerComponentProps): JSX.Element => {
  const [showJson, setShowJson] = useState(false);

  const jsonToggleAction = (
    <Tooltip title={showJson ? 'Switch to formatted view' : 'Switch to raw JSON view'} arrow>
      <IconButton size="small" onClick={() => setShowJson(!showJson)} color={showJson ? 'primary' : 'default'} sx={{ mr: 0.5 }}>
        <CodeIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  const { accountId, endpoint, defaultVendor, adapter, timeout, bidders, syncUrl, ...otherProps } = s2sConfig;
  const biddersList: string[] = Array.isArray(bidders) ? bidders : bidders ? [String(bidders)] : [];
  const otherEntries = Object.entries(otherProps).filter(([, val]) => val !== undefined && val !== null);

  const subtitle = accountId
    ? `Account: ${accountId}`
    : endpoint
    ? `Endpoint: ${typeof endpoint === 'string' ? endpoint.replace(/^https?:\/\//, '') : 'Configured'}`
    : 'Server Config';

  return (
    <ExpandableTile
      icon={<DnsIcon />}
      title={index !== undefined ? `Prebid Server #${index + 1}` : 'Prebid Server'}
      subtitle={subtitle}
      defaultMaxWidth={4}
      expandedMaxWidth={8}
      headerAction={jsonToggleAction}
    >
      {showJson ? (
        <Grid size={{ xs: 12 }}>
          <JSONViewerComponent src={s2sConfig} name="" collapsed={1} />
        </Grid>
      ) : (
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
            Connection & Account
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.25 }}>
            {accountId && (
              <Chip
                label={`Account ID: ${accountId}`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
              />
            )}
            {endpoint && (
              <Chip
                label={`Endpoint: ${typeof endpoint === 'string' ? endpoint : JSON.stringify(endpoint)}`}
                size="small"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500, maxWidth: '100%' }}
              />
            )}
            {timeout !== undefined && (
              <Chip
                label={`Timeout: ${timeout}ms`}
                size="small"
                color="info"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
              />
            )}
            {adapter && (
              <Chip
                label={`Adapter: ${adapter}`}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
              />
            )}
            {defaultVendor && (
              <Chip
                label={`Vendor: ${defaultVendor}`}
                size="small"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
              />
            )}
            {syncUrl && (
              <Chip
                label={`Sync URL: ${typeof syncUrl === 'string' ? syncUrl : 'Custom'}`}
                size="small"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
              />
            )}
          </Box>

          {biddersList.length > 0 && (
            <Box sx={{ mb: 1.25 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
                Server Bidders ({biddersList.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {biddersList.map((bidder) => (
                  <Chip
                    key={bidder}
                    label={bidder}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {otherEntries.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
                Additional Settings
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {otherEntries.map(([key, val]) => (
                  <Chip
                    key={key}
                    label={`${key}: ${typeof val === 'object' ? JSON.stringify(val) : String(val)}`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem' }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Grid>
      )}
    </ExpandableTile>
  );
};

const PrebidServerComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const s2sConfig = prebid?.config?.s2sConfig;
  if (!s2sConfig) return null;

  return (
    <>
      {Array.isArray(s2sConfig) ? (
        s2sConfig.map((config, i) => (
          <RenderPrebidServerComponent
            s2sConfig={config}
            index={s2sConfig.length > 1 ? i : undefined}
            key={(config as any).accountId || (config as any).endpoint || i}
          />
        ))
      ) : (
        <RenderPrebidServerComponent s2sConfig={s2sConfig as any} />
      )}
    </>
  );
};

export default PrebidServerComponent;
