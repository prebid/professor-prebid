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

const GptPreAuctionComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const [showJson, setShowJson] = useState(false);
  const gptPreAuction = prebid?.config?.gptPreAuction as Record<string, any> | undefined;

  if (!gptPreAuction || Object.keys(gptPreAuction).length === 0) return null;

  const jsonToggleAction = (
    <Tooltip title={showJson ? 'Switch to formatted view' : 'Switch to raw JSON view'} arrow>
      <IconButton size="small" onClick={() => setShowJson(!showJson)} color={showJson ? 'primary' : 'default'} sx={{ mr: 0.5 }}>
        <CodeIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  const { enabled, mcmEnabled, customGptSlots, ...otherProps } = gptPreAuction;
  const otherEntries = Object.entries(otherProps).filter(([, val]) => val !== undefined && val !== null);

  return (
    <ExpandableTile icon={<BorderBottomIcon />} title="GPT Pre-Auction Module" subtitle="MCM & Pre-Auction Config" defaultMaxWidth={4} expandedMaxWidth={8} headerAction={jsonToggleAction}>
      {showJson ? (
        <Grid size={{ xs: 12 }}>
          <JSONViewerComponent src={gptPreAuction} name="" collapsed={1} />
        </Grid>
      ) : (
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
            Module Status & MCM
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            <Chip label={`Status: ${enabled === false ? 'disabled' : 'enabled'}`} size="small" color={enabled === false ? 'default' : 'success'} variant={enabled === false ? 'outlined' : 'filled'} sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />
            {mcmEnabled !== undefined && <Chip label={`MCM Enabled: ${String(mcmEnabled)}`} size="small" color={mcmEnabled ? 'primary' : 'default'} variant={mcmEnabled ? 'filled' : 'outlined'} sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
            {customGptSlots && <Chip label={`Custom Slots: ${Array.isArray(customGptSlots) ? customGptSlots.length : 'Configured'}`} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
          </Box>

          {otherEntries.length > 0 && (
            <Box sx={{ mt: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
                Parameters
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

export default GptPreAuctionComponent;
