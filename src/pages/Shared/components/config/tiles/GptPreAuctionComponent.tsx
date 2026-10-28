import React, { useContext } from 'react';
import BorderBottomIcon from '@mui/icons-material/BorderBottom';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';
import { ChipRow, SectionLabel } from '../../Section';

const GptPreAuctionComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const gptPreAuction = prebid?.config?.gptPreAuction as Record<string, any> | undefined;

  if (!gptPreAuction || Object.keys(gptPreAuction).length === 0) return null;

  const { enabled, mcmEnabled, customGptSlots, ...otherProps } = gptPreAuction;
  const otherEntries = Object.entries(otherProps).filter(([, val]) => val !== undefined && val !== null);

  return (
    <ExpandableTile icon={<BorderBottomIcon />} title="GPT Pre-Auction Module" subtitle="MCM & Pre-Auction Config" defaultMaxWidth={4} expandedMaxWidth={8} json={gptPreAuction}>
      <Grid size={{ xs: 12 }}>
        <SectionLabel>Module Status & MCM</SectionLabel>
        <ChipRow sx={{ mb: 1 }}>
          <Chip label={`Status: ${enabled === false ? 'disabled' : 'enabled'}`} size="small" color={enabled === false ? 'default' : 'success'} variant={enabled === false ? 'outlined' : 'filled'} sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />
          {mcmEnabled !== undefined && <Chip label={`MCM Enabled: ${String(mcmEnabled)}`} size="small" color={mcmEnabled ? 'primary' : 'default'} variant={mcmEnabled ? 'filled' : 'outlined'} sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
          {customGptSlots && <Chip label={`Custom Slots: ${Array.isArray(customGptSlots) ? customGptSlots.length : 'Configured'}`} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
        </ChipRow>

        {otherEntries.length > 0 && (
          <Box sx={{ mt: 0.5 }}>
            <SectionLabel>Parameters</SectionLabel>
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

export default GptPreAuctionComponent;
