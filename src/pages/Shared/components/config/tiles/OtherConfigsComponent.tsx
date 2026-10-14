import React, { useContext, useState } from 'react';
import TuneIcon from '@mui/icons-material/Tune';
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

const KNOWN_CONFIG_KEYS = new Set([
  'priceGranularity',
  'customPriceBucket',
  'mediaTypePriceGranularity',
  'bidderSequence',
  'bidderTimeout',
  'enableSendAllBids',
  'maxNestedIframes',
  'useBidCache',
  'cache',
  'deviceAccess',
  's2sConfig',
  'consentManagement',
  'userSync',
  'userIds',
  'floors',
  'gptPreAuction',
  'analytics',
  'enableAnalytics',
  'ortb2',
  'currency',
  'realTimeData',
  'installedModules',
  'bidderSettings',
  'paapi',
  'fledge',
]);

const OtherConfigsComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const [showJson, setShowJson] = useState(false);
  const config = (prebid?.config || {}) as Record<string, any>;

  const otherKeys = Object.keys(config).filter((key) => !KNOWN_CONFIG_KEYS.has(key));

  if (!otherKeys.length) {
    return null;
  }

  const otherConfigObject = otherKeys.reduce((acc, key) => {
    acc[key] = config[key];
    return acc;
  }, {} as Record<string, any>);

  const jsonToggleAction = (
    <Tooltip title={showJson ? 'Switch to formatted view' : 'Switch to raw JSON view'} arrow>
      <IconButton size="small" onClick={() => setShowJson(!showJson)} color={showJson ? 'primary' : 'default'} sx={{ mr: 0.5 }}>
        <CodeIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  return (
    <ExpandableTile icon={<TuneIcon />} title="Additional Configs" subtitle={`${otherKeys.length} extra parameter(s)`} defaultMaxWidth={4} expandedMaxWidth={8} headerAction={jsonToggleAction}>
      {showJson ? (
        <Grid size={{ xs: 12 }}>
          <JSONViewerComponent src={otherConfigObject} name="" collapsed={1} />
        </Grid>
      ) : (
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
            Custom Parameters
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {otherKeys.map((key) => {
              const val = config[key];
              const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
              return (
                <Chip
                  key={key}
                  label={
                    <>
                      <strong>{key}: </strong>
                      {strVal}
                    </>
                  }
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: '0.7rem', maxWidth: '100%' }}
                />
              );
            })}
          </Box>
        </Grid>
      )}
    </ExpandableTile>
  );
};

export default OtherConfigsComponent;
