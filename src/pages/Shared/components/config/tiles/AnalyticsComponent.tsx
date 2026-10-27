import React, { useContext, useState } from 'react';
import AnalyticsIcon from '@mui/icons-material/Analytics';
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

const AnalyticsComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const [showJson, setShowJson] = useState(false);
  const config = (prebid?.config || {}) as Record<string, any>;
  const analytics = config.analytics || config.enableAnalytics;

  if (!analytics || (typeof analytics === 'object' && Object.keys(analytics).length === 0)) {
    return null;
  }

  const jsonToggleAction = (
    <Tooltip title={showJson ? 'Switch to formatted view' : 'Switch to raw JSON view'} arrow>
      <IconButton size="small" onClick={() => setShowJson(!showJson)} color={showJson ? 'primary' : 'default'} sx={{ mr: 0.5 }}>
        <CodeIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  const adapters = Array.isArray(analytics) ? analytics : typeof analytics === 'object' ? Object.keys(analytics) : [String(analytics)];

  return (
    <ExpandableTile icon={<AnalyticsIcon />} title="Analytics" subtitle={`${adapters.length} adapter(s) / settings`} defaultMaxWidth={4} expandedMaxWidth={8} headerAction={jsonToggleAction}>
      {showJson ? (
        <Grid size={{ xs: 12 }}>
          <JSONViewerComponent src={analytics} name="" collapsed={1} />
        </Grid>
      ) : (
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
            Analytics Adapters
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {adapters.map((item, idx) => (
              <Chip key={idx} label={typeof item === 'object' ? item.provider || item.type || `Adapter ${idx + 1}` : item} size="small" color="info" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />
            ))}
          </Box>
        </Grid>
      )}
    </ExpandableTile>
  );
};

export default AnalyticsComponent;
