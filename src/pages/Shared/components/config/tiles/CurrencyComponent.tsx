import React, { useContext, useState } from 'react';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
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

const CurrencyComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const [showJson, setShowJson] = useState(false);
  const currency = prebid?.config?.currency;

  if (!currency || (typeof currency === 'object' && Object.keys(currency).length === 0)) {
    return null;
  }

  const jsonToggleAction = (
    <Tooltip title={showJson ? 'Switch to formatted view' : 'Switch to raw JSON view'} arrow>
      <IconButton size="small" onClick={() => setShowJson(!showJson)} color={showJson ? 'primary' : 'default'} sx={{ mr: 0.5 }}>
        <CodeIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  const isString = typeof currency === 'string';
  const adServerCurrency = isString ? currency : currency.adServerCurrency;
  const granularityMultiplier = !isString ? currency.granularityMultiplier : undefined;
  const rates = !isString && typeof currency.rates === 'object' ? currency.rates : undefined;
  const rateKeys = rates ? Object.keys(rates) : [];

  const otherEntries = !isString ? Object.entries(currency).filter(([k, v]) => !['adServerCurrency', 'granularityMultiplier', 'rates'].includes(k) && v !== undefined) : [];

  return (
    <ExpandableTile icon={<AttachMoneyIcon />} title="Currency" subtitle={adServerCurrency ? `Ad Server: ${adServerCurrency}` : 'Currency conversion active'} defaultMaxWidth={4} expandedMaxWidth={8} headerAction={jsonToggleAction}>
      {showJson ? (
        <Grid size={{ xs: 12 }}>
          <JSONViewerComponent src={typeof currency === 'object' ? currency : { currency }} name="" collapsed={1} />
        </Grid>
      ) : (
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
            Ad Server & Settings
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.25 }}>
            {adServerCurrency && (
              <Chip
                label={
                  <>
                    <span>Ad Server Currency:</span> <strong>{adServerCurrency}</strong>
                  </>
                }
                size="small"
                color="primary"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
              />
            )}
            {granularityMultiplier !== undefined && <Chip label={`Granularity Multiplier: ${granularityMultiplier}`} size="small" color="info" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
            {otherEntries.map(([k, v]) => (
              <Chip key={k} label={`${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
            ))}
          </Box>

          {rateKeys.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
                Conversion Rates ({rateKeys.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {rateKeys.map((code) => (
                  <Chip key={code} label={`${code}: ${rates[code]}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.675rem' }} />
                ))}
              </Box>
            </Box>
          )}
        </Grid>
      )}
    </ExpandableTile>
  );
};

export default CurrencyComponent;
