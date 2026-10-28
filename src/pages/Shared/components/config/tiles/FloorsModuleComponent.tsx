import React, { useContext } from 'react';
import BorderBottomIcon from '@mui/icons-material/BorderBottom';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';
import { ChipRow, SectionLabel } from '../../Section';

const FloorsModuleComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const floors = prebid?.config?.floors as Record<string, any> | undefined;

  if (!floors || Object.keys(floors).length === 0) return null;

  const { enabled, floorMin, mode, data, enforcement, ...otherProps } = floors;
  const currency = floors.currency || data?.currency;
  const otherEntries = Object.entries(otherProps).filter(([, val]) => val !== undefined && val !== null);

  return (
    <ExpandableTile icon={<BorderBottomIcon />} title="Floors Module" subtitle="Dynamic Floors" defaultMaxWidth={4} expandedMaxWidth={8} json={floors}>
      <Grid size={{ xs: 12 }}>
        <SectionLabel>Configuration & Rules</SectionLabel>
        <ChipRow sx={{ mb: 1 }}>
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
        </ChipRow>

        {data && (
          <Box sx={{ mt: 1 }}>
            <SectionLabel>Floor Data Provider</SectionLabel>
            <ChipRow>
              {data.modelTimestamp && <Chip label={`Timestamp: ${data.modelTimestamp}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.675rem' }} />}
              {data.modelVersion && <Chip label={`Version: ${data.modelVersion}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.675rem' }} />}
              {data.schema && <Chip label={`Schema: ${data.schema.fields ? data.schema.fields.join(' > ') : 'configured'}`} size="small" color="secondary" variant="outlined" sx={{ height: 20, fontSize: '0.675rem' }} />}
            </ChipRow>
          </Box>
        )}

        {otherEntries.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <SectionLabel>Other Parameters</SectionLabel>
            <ChipRow>
              {otherEntries.map(([key, val]) => (
                <Chip key={key} label={`${key}: ${typeof val === 'object' ? JSON.stringify(val) : String(val)}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.675rem' }} />
              ))}
            </ChipRow>
          </Box>
        )}
      </Grid>
    </ExpandableTile>
  );
};

export default FloorsModuleComponent;
