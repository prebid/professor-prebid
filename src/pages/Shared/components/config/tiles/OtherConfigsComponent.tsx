import React, { useContext } from 'react';
import TuneIcon from '@mui/icons-material/Tune';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';

import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';
import { ChipRow, SectionLabel } from '../../Section';

const KNOWN_CONFIG_KEYS = new Set([
  'priceGranularity',
  'customPriceBucket',
  'mediaTypePriceGranularity',
  'bidderSequence',
  'bidderTimeout',
  'enableSendAllBids',
  'maxNestedIframes',
  'useBidCache',
  'cache',
  'deviceAccess',
  's2sConfig',
  'consentManagement',
  'coppa',
  'userSync',
  'userIds',
  'floors',
  'gptPreAuction',
  'analytics',
  'enableAnalytics',
  'ortb2',
  'currency',
  'realTimeData',
  'installedModules',
  'bidderSettings',
]);

const OtherConfigsComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const config = (prebid?.config || {}) as Record<string, any>;

  const otherKeys = Object.keys(config).filter((key) => !KNOWN_CONFIG_KEYS.has(key));

  if (!otherKeys.length) {
    return null;
  }

  const otherConfigObject = otherKeys.reduce((acc, key) => {
    acc[key] = config[key];
    return acc;
  }, {} as Record<string, any>);

  return (
    <ExpandableTile icon={<TuneIcon />} title="Additional Configs" subtitle={`${otherKeys.length} extra parameter(s)`} defaultMaxWidth={4} expandedMaxWidth={8} json={otherConfigObject}>
      <Grid size={{ xs: 12 }}>
        <SectionLabel>Custom Parameters</SectionLabel>
        <ChipRow>
          {otherKeys.map((key) => {
            const val = config[key];
            const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
            return (
              <Chip
                key={key}
                label={
                  <>
                    <strong>{key}: </strong>
                    {strVal}
                  </>
                }
                size="small"
                variant="outlined"
                sx={{ height: 22, fontSize: '0.7rem', maxWidth: '100%' }}
              />
            );
          })}
        </ChipRow>
      </Grid>
    </ExpandableTile>
  );
};

export default OtherConfigsComponent;
