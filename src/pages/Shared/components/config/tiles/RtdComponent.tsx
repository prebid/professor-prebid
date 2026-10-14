import React, { useContext, useState } from 'react';
import HubIcon from '@mui/icons-material/Hub';
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

const RtdComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const [showJson, setShowJson] = useState(false);
  const realTimeData = prebid?.config?.realTimeData;

  if (!realTimeData || (typeof realTimeData === 'object' && Object.keys(realTimeData).length === 0)) {
    return null;
  }

  const providers = realTimeData.dataProviders || [];

  const jsonToggleAction = (
    <Tooltip title={showJson ? 'Switch to formatted view' : 'Switch to raw JSON view'} arrow>
      <IconButton size="small" onClick={() => setShowJson(!showJson)} color={showJson ? 'primary' : 'default'} sx={{ mr: 0.5 }}>
        <CodeIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  return (
    <ExpandableTile icon={<HubIcon />} title="Real-Time Data (RTD)" subtitle={providers.length ? `${providers.length} provider(s) configured` : 'RTD module active'} defaultMaxWidth={4} expandedMaxWidth={8} headerAction={jsonToggleAction}>
      {showJson ? (
        <Grid size={{ xs: 12 }}>
          <JSONViewerComponent src={realTimeData} name="" collapsed={1} />
        </Grid>
      ) : (
        <Grid size={{ xs: 12 }}>
          {providers.length > 0 ? (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
                Data Providers ({providers.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {providers.map((p: any, idx: number) => (
                  <Chip key={idx} label={p.name || `Provider ${idx + 1}`} size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />
                ))}
              </Box>
            </>
          ) : (
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              RTD module is loaded with custom rules.
            </Typography>
          )}
        </Grid>
      )}
    </ExpandableTile>
  );
};

export default RtdComponent;
