import React, { useContext, useState } from 'react';
import Typography from '@mui/material/Typography';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import CodeIcon from '@mui/icons-material/Code';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';
import JSONViewerComponent from '../../JSONViewerComponent';

const BidderSettingsComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const [showJson, setShowJson] = useState(false);
  const { bidderSettings } = prebid;

  if (!bidderSettings || Object.keys(bidderSettings).length === 0) return null;

  const storageBidders = Object.keys(bidderSettings).filter((b) => bidderSettings[b].storageAllowed !== undefined);

  const jsonToggleAction = (
    <Tooltip title={showJson ? 'Switch to formatted view' : 'Switch to raw JSON view'} arrow>
      <IconButton size="small" onClick={() => setShowJson(!showJson)} color={showJson ? 'primary' : 'default'} sx={{ mr: 0.5 }}>
        <CodeIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  return (
    <ExpandableTile icon={<SettingsApplicationsIcon />} title="Bidder Settings" subtitle="Storage access & bidder defaults" defaultMaxWidth={4} expandedMaxWidth={8} headerAction={jsonToggleAction}>
      {showJson ? (
        <Grid size={{ xs: 12 }}>
          <JSONViewerComponent src={bidderSettings} name="" collapsed={1} />
        </Grid>
      ) : (
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
            Storage Access Permissions
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {storageBidders.map((bidder) => {
              const allowed = bidderSettings[bidder].storageAllowed;
              return <Chip key={bidder} label={`${bidder}: ${allowed ? 'allowed' : 'denied'}`} size="small" color={allowed ? 'success' : 'error'} variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />;
            })}
          </Box>
        </Grid>
      )}
    </ExpandableTile>
  );
};

export default BidderSettingsComponent;
