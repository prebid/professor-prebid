import React, { useEffect, useContext, useState } from 'react';
import StraightenIcon from '@mui/icons-material/Straighten';
import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

type Bucket = { precision: number; min: number; max: number; increment: number };
const defaultBuckets: Record<string, Bucket[]> = {
  low: [{ precision: 2, min: 0, max: 5, increment: 0.5 }],
  medium: [{ precision: 2, min: 0, max: 20, increment: 0.1 }],
  high: [{ precision: 2, min: 0, max: 20, increment: 0.01 }],
  auto: [
    { precision: 2, min: 0, max: 5, increment: 0.05 },
    { precision: 2, min: 5, max: 10, increment: 0.1 },
    { precision: 2, min: 10, max: 20, increment: 0.5 },
  ],
  dense: [
    { precision: 2, min: 0, max: 3, increment: 0.01 },
    { precision: 2, min: 3, max: 8, increment: 0.05 },
    { precision: 2, min: 8, max: 20, increment: 0.5 },
  ],
};

const PriceGranularityComponent = (): JSX.Element => {
  const { prebid } = useContext(AppStateContext);
  const { priceGranularity, customPriceBucket } = prebid.config;
  const [rows, setRows] = useState<Bucket[]>([]);

  useEffect(() => {
    setRows(defaultBuckets[priceGranularity as keyof typeof defaultBuckets] || customPriceBucket?.buckets || []);
  }, [priceGranularity, customPriceBucket]);

  return (
    <ExpandableTile icon={<StraightenIcon />} title="Price Granularity" subtitle={`${priceGranularity} (${Object.keys(defaultBuckets).includes(priceGranularity) ? 'default' : 'custom'})`} expandedMaxWidth={8}>
      {rows.map((row, i) => (
        <Grid size={{ xs: 6 }} key={i}>
          <Typography variant="body1">
            {row.min}–{row.max} ({row.increment})
          </Typography>
        </Grid>
      ))}
    </ExpandableTile>
  );
};

export default PriceGranularityComponent;
