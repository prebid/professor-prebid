import React, { useEffect, useContext } from 'react';
import { IPrebidConfigPriceBucket } from '../../../../Injected/prebid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import StraightenIcon from '@mui/icons-material/Straighten';
import Box from '@mui/system/Box';
import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

const defaultBuckets: IDefaultBuckets = {
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

const PriceGranularityComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const config: Record<string, any> = prebid?.config || {};
  const { priceGranularity, customPriceBucket, mediaTypePriceGranularity } = config;

  if (!priceGranularity) return null;

  const hasMediaTypePriceGranularityBuckets = (() => {
    if (!mediaTypePriceGranularity) {
      return false;
    }

    const typedMediaTypePg = mediaTypePriceGranularity as Record<string, { buckets?: IPrebidConfigPriceBucket[] }>;

    return Object.values(typedMediaTypePg).some((value) => Array.isArray(value.buckets) && value.buckets.length > 0);
  })();

  const activeBucket = defaultBuckets[priceGranularity] || (customPriceBucket?.buckets as any);

  return (
    <ExpandableTile icon={<StraightenIcon />} title="Price Granularity" subtitle={`${priceGranularity} (${Object.keys(defaultBuckets)?.includes(priceGranularity) ? 'default' : 'custom'})`} defaultMaxWidth={4} expandedMaxWidth={12}>
      {/* Media-type specific price granularities */}
      {hasMediaTypePriceGranularityBuckets && (
        <Box sx={{ mb: 2, width: '100%' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary', fontSize: '0.75rem' }}>
            Media Type Overrides
          </Typography>

          <Grid container spacing={2}>
            {Object.entries(mediaTypePriceGranularity)
              .filter(([, value]) => value && Array.isArray((value as any).buckets))
              .map(([mediaType, value]) => {
                const buckets = (value as any).buckets || [];
                if (!buckets.length) return null;

                return (
                  <Grid size={{ xs: 12 }} key={mediaType}>
                    <Box sx={{ backgroundColor: 'action.hover', p: 0.5, borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ mb: 0.5, ml: 0.5, fontWeight: 600 }}>
                        {mediaType}
                      </Typography>
                      <BucketTable buckets={buckets} type={mediaType} />
                    </Box>
                  </Grid>
                );
              })}
          </Grid>
        </Box>
      )}

      <Grid container spacing={1} sx={{ width: '100%' }}>
        {/* Summary Stats */}
        {activeBucket?.[0] && (
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              <Chip label={`Min: ${activeBucket[0]?.min}`} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />
              <Chip label={`Max: ${activeBucket[activeBucket.length - 1]?.max ?? activeBucket[0]?.max}`} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />
              <Chip label={`Precision: ${activeBucket[0]?.precision ?? 2}`} size="small" color="info" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />
              {activeBucket.length === 1 && <Chip label={`Increment: ${activeBucket[0]?.increment}`} size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />}
            </Box>
          </Grid>
        )}

        <Grid size={{ xs: 12 }}>
          <PriceGranularityTable priceGranularity={priceGranularity} customPriceBucket={customPriceBucket as any} />
        </Grid>
      </Grid>
    </ExpandableTile>
  );
};

const BucketTable = ({ buckets, type }: { buckets: IPrebidConfigPriceBucket[]; type?: string }) => {
  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
      <Table size="small" aria-label="price granularity buckets">
        <TableHead sx={{ bgcolor: 'action.hover' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>Bucket</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>
              Precision
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>
              Min
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>
              Max
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>
              Increment
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {buckets.map((bucket: IPrebidConfigPriceBucket, index: number) => (
            <TableRow key={`${type}-${index}`} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell component="th" scope="row" sx={{ fontSize: '0.75rem', py: 0.5 }}>
                {type ? `${type} #${index + 1}` : `Bucket #${index + 1}`}
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '0.75rem', py: 0.5 }}>
                {bucket.precision ?? 2}
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '0.75rem', py: 0.5 }}>
                {bucket.min}
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '0.75rem', py: 0.5 }}>
                {bucket.max}
              </TableCell>
              <TableCell align="right" sx={{ fontSize: '0.75rem', py: 0.5 }}>
                {bucket.increment}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const PriceGranularityTable = ({ priceGranularity, customPriceBucket }: IPriceGranularityComponentProps) => {
  const [rows, setRows] = React.useState<IPrebidConfigPriceBucket[]>([]);
  useEffect(() => {
    const rows = defaultBuckets[priceGranularity] || customPriceBucket?.buckets || [];
    setRows(rows);
  }, [priceGranularity, customPriceBucket?.buckets]);

  return (
    <Box sx={{ width: '100%', mt: 1 }}>
      <BucketTable buckets={rows} type={priceGranularity} />
    </Box>
  );
};

interface IPriceGranularityComponentProps {
  priceGranularity: string;
  customPriceBucket: {
    buckets: IPrebidConfigPriceBucket[];
  };
}

interface IDefaultBuckets {
  [key: string]: {
    precision: number;
    min: number;
    max: number;
    increment: number;
  }[];
}

export default PriceGranularityComponent;
