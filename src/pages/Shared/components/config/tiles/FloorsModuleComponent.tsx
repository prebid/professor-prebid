import React, { useContext, useState } from 'react';
import BorderBottomIcon from '@mui/icons-material/BorderBottom';
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

const FloorsModuleComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const [showJson, setShowJson] = useState(false);
  const floors = prebid?.config?.floors as Record<string, any> | undefined;

  if (!floors || Object.keys(floors).length === 0) return null;

  const jsonToggleAction = (
    <Tooltip title={showJson ? 'Switch to formatted view' : 'Switch to raw JSON view'} arrow>
      <IconButton size="small" onClick={() => setShowJson(!showJson)} color={showJson ? 'primary' : 'default'} sx={{ mr: 0.5 }}>
        <CodeIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  const { enabled, floorMin, mode, data, enforcement, ...otherProps } = floors;
  const currency = floors.currency || data?.currency;
  const otherEntries = Object.entries(otherProps).filter(([, val]) => val !== undefined && val !== null);

  return (
    <ExpandableTile icon={<BorderBottomIcon />} title="Floors Module" subtitle="Dynamic Floors" defaultMaxWidth={4} expandedMaxWidth={8} headerAction={jsonToggleAction}>
      {showJson ? (
        <Grid size={{ xs: 12 }}>
          <JSONViewerComponent src={floors} name="" collapsed={1} />
        </Grid>
      ) : (
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
            Configuration & Rules
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            <Chip label={`Status: ${enabled === false ? 'disabled' : 'enabled'}`} size="small" color={enabled === false ? 'default' : 'success'} variant={enabled === false ? 'outlined' : 'filled'} sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />
            {currency && <Chip label={`Currency: ${currency}`} size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }} />}
            {floorMin !== undefined && <Chip label={`Floor Min: ${floorMin}`} size="small" color="info" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
            {mode && <Chip label={`Mode: ${mode}`} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
            {enforcement && (
              <Chip
                label={`Enforcement: ${
                  typeof enforcement === 'object'
                    ? Object.keys(enforcement)
                        .filter((k) => enforcement[k])
                        .join(', ') || 'configured'
                    : String(enforcement)
                }`}
                size="small"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
              />
            )}
          </Box>

          {data && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
                Floor Data Provider
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {data.modelTimestamp && <Chip label={`Timestamp: ${data.modelTimestamp}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.675rem' }} />}
                {data.modelVersion && <Chip label={`Version: ${data.modelVersion}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.675rem' }} />}
                {data.schema && <Chip label={`Schema: ${data.schema.fields ? data.schema.fields.join(' > ') : 'configured'}`} size="small" color="secondary" variant="outlined" sx={{ height: 20, fontSize: '0.675rem' }} />}
              </Box>
            </Box>
          )}

          {otherEntries.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
                Other Parameters
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {otherEntries.map(([key, val]) => (
                  <Chip key={key} label={`${key}: ${typeof val === 'object' ? JSON.stringify(val) : String(val)}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.675rem' }} />
                ))}
              </Box>
            </Box>
          )}
        </Grid>
      )}
    </ExpandableTile>
  );
};

export default FloorsModuleComponent;
