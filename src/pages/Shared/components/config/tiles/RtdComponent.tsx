import React, { useContext } from 'react';
import HubIcon from '@mui/icons-material/Hub';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';
import { ChipRow, SectionLabel } from '../../Section';

const RtdComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const realTimeData = prebid?.config?.realTimeData;

  if (!realTimeData || (typeof realTimeData === 'object' && Object.keys(realTimeData).length === 0)) {
    return null;
  }

  const providers = realTimeData.dataProviders || [];

  return (
    <ExpandableTile icon={<HubIcon />} title="Real-Time Data (RTD)" subtitle={providers.length ? `${providers.length} provider(s) configured` : 'RTD module active'} defaultMaxWidth={4} expandedMaxWidth={8} json={realTimeData}>
      <Grid size={{ xs: 12 }}>
        {providers.length > 0 ? (
          <>
            <SectionLabel>Data Providers ({providers.length})</SectionLabel>
            <ChipRow sx={{ mb: 1 }}>
              {providers.map((p: any, idx: number) => (
                <Chip key={idx} label={p.name || `Provider ${idx + 1}`} size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />
              ))}
            </ChipRow>
          </>
        ) : (
          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
            RTD module is loaded with custom rules.
          </Typography>
        )}
      </Grid>
    </ExpandableTile>
  );
};

export default RtdComponent;
