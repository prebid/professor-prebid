import React, { useContext } from 'react';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';

import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';
import { ChipRow, SectionLabel } from '../../Section';

const BidderSettingsComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const { bidderSettings } = prebid || {};

  if (!bidderSettings || Object.keys(bidderSettings).length === 0) return null;

  const storageBidders = Object.keys(bidderSettings).filter((b) => bidderSettings[b].storageAllowed !== undefined);

  return (
    <ExpandableTile icon={<SettingsApplicationsIcon />} title="Bidder Settings" subtitle="Storage access & bidder defaults" defaultMaxWidth={4} expandedMaxWidth={8} json={bidderSettings}>
      <Grid size={{ xs: 12 }}>
        <SectionLabel>Storage Access Permissions</SectionLabel>
        <ChipRow>
          {storageBidders.map((bidder) => {
            const allowed = bidderSettings[bidder].storageAllowed;
            return <Chip key={bidder} label={`${bidder}: ${allowed ? 'allowed' : 'denied'}`} size="small" color={allowed ? 'success' : 'error'} variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />;
          })}
        </ChipRow>
      </Grid>
    </ExpandableTile>
  );
};

export default BidderSettingsComponent;
