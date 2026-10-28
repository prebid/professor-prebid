import React, { useContext } from 'react';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';

import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';
import { ChipRow, SectionLabel } from '../../Section';

const AnalyticsComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const config = (prebid?.config || {}) as Record<string, any>;
  const analytics = config.analytics || config.enableAnalytics;

  if (!analytics || (typeof analytics === 'object' && Object.keys(analytics).length === 0)) {
    return null;
  }

  const adapters = Array.isArray(analytics) ? analytics : typeof analytics === 'object' ? Object.keys(analytics) : [String(analytics)];

  return (
    <ExpandableTile icon={<AnalyticsIcon />} title="Analytics" subtitle={`${adapters.length} adapter(s) / settings`} defaultMaxWidth={4} expandedMaxWidth={8} json={analytics}>
      <Grid size={{ xs: 12 }}>
        <SectionLabel>Analytics Adapters</SectionLabel>
        <ChipRow>
          {adapters.map((item, idx) => (
            <Chip key={idx} label={typeof item === 'object' ? item.provider || item.type || `Adapter ${idx + 1}` : item} size="small" color="info" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />
          ))}
        </ChipRow>
      </Grid>
    </ExpandableTile>
  );
};

export default AnalyticsComponent;
