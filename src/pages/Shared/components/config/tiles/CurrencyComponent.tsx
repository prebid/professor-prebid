import React, { useContext } from 'react';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';
import { ChipRow, SectionLabel } from '../../Section';

const CurrencyComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const currency = prebid?.config?.currency;

  if (!currency || (typeof currency === 'object' && Object.keys(currency).length === 0)) {
    return null;
  }

  const isString = typeof currency === 'string';
  const adServerCurrency = isString ? currency : currency.adServerCurrency;
  const granularityMultiplier = !isString ? currency.granularityMultiplier : undefined;
  const rates = !isString && typeof currency.rates === 'object' ? currency.rates : undefined;
  const rateKeys = rates ? Object.keys(rates) : [];

  const otherEntries = !isString ? Object.entries(currency).filter(([k, v]) => !['adServerCurrency', 'granularityMultiplier', 'rates'].includes(k) && v !== undefined) : [];

  return (
    <ExpandableTile
      icon={<AttachMoneyIcon />}
      title="Currency"
      subtitle={adServerCurrency ? `Ad Server: ${adServerCurrency}` : 'Currency conversion active'}
      defaultMaxWidth={4}
      expandedMaxWidth={8}
      json={typeof currency === 'object' ? currency : { currency }}
    >
      <Grid size={{ xs: 12 }}>
        <SectionLabel>Ad Server & Settings</SectionLabel>
        <ChipRow sx={{ mb: 1.25 }}>
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
        </ChipRow>

        {rateKeys.length > 0 && (
          <Box>
            <SectionLabel>Conversion Rates ({rateKeys.length})</SectionLabel>
            <ChipRow>
              {rateKeys.map((code) => (
                <Chip key={code} label={`${code}: ${rates[code]}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.675rem' }} />
              ))}
            </ChipRow>
          </Box>
        )}
      </Grid>
    </ExpandableTile>
  );
};

export default CurrencyComponent;
