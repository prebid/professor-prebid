import React, { useEffect, useContext } from 'react';
import { IPrebidConfigPriceBucket } from '../../../../Injected/prebid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import StraightenIcon from '@mui/icons-material/Straighten';
import Box from '@mui/system/Box';
import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';

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

const PriceGranularityComponent = () => {
  const { prebid } = useContext(AppStateContext);
  const {
    config: { priceGranularity, customPriceBucket, mediaTypePriceGranularity },
  } = prebid;

  const hasMediaTypePriceGranularityBuckets = (() => {
    if (!mediaTypePriceGranularity) {
      return false;
    }

    const typedMediaTypePg = mediaTypePriceGranularity as Record<string, { buckets?: IPrebidConfigPriceBucket[] }>;

    return Object.values(typedMediaTypePg).some((value) => Array.isArray(value.buckets) && value.buckets.length > 0);
  })();

  const hasMediaTypePriceGranularityBuckets = (() => {
    if (!mediaTypePriceGranularity) {
      return false;
    }

    const typedMediaTypePg = mediaTypePriceGranularity as Record<string, { buckets?: IPrebidConfigPriceBucket[] }>;

    return Object.values(typedMediaTypePg).some((value) => Array.isArray(value.buckets) && value.buckets.length > 0);
  })();

  return (

    <ExpandableTile icon={<StraightenIcon />} title="Price Granularity" subtitle={`${priceGranularity} (${Object.keys(defaultBuckets)?.includes(priceGranularity) ? 'default' : 'custom'})`} defaultMaxWidth={4} expandedMaxWidth={12}>
      {/* Media-type specific price granularities */}
      {hasMediaTypePriceGranularityBuckets && (
        <Box sx={{ mb: 2, width: '100%' }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Media type price granularity (overrides global priceGranularity when present):
          </Typography>

    <Grid item xs={12} sm={maxWidth} ref={ref}>
      <Card sx={{ width: 1, minHeight: tileHeight }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <StraightenIcon />
            </Avatar>
          }
          title={<Typography variant="h3">Price Granularity</Typography>}
          subheader={
            <Typography variant="subtitle1">
              {priceGranularity} ({Object.keys(defaultBuckets)?.includes(priceGranularity) ? 'default' : 'custom'})
            </Typography>
          }
          action={
            <ExpandMoreIcon
              sx={{
                transform: !expanded ? 'rotate(0deg)' : 'rotate(180deg)',
                marginLeft: 'auto',
              }}
            />
          }
          onClick={handleExpandClick}
        />
        <CardContent>
          {/* Media-type specific price granularities, shown before global priceGranularity */}
          {hasMediaTypePriceGranularityBuckets && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Media type price granularity (overrides global priceGranularity when present):
              </Typography>

              {/* Collapsed: just show how many buckets per media type */}
              {!expanded && (
                <Grid container spacing={1}>
                  {Object.entries(mediaTypePriceGranularity)
                    .filter(([, value]) => value && Array.isArray((value as any).buckets))
                    .map(([mediaType, value]) => {
                      const buckets = (value as any).buckets || [];

                      if (!buckets.length) {
                        return null;
                      }

                      return (
                        <Grid item xs={12} key={mediaType}>
                          <Typography variant="body2">
                            <strong>{mediaType}</strong>: {buckets.length} bucket{buckets.length > 1 ? 's' : ''}
                          </Typography>
                        </Grid>
                      );
                    })}
                </Grid>
              )}

              {/* Expanded: full table of buckets per media type */}
              {expanded && (
                <Grid container spacing={2}>
                  {Object.entries(mediaTypePriceGranularity)
                    .filter(([, value]) => value && Array.isArray((value as any).buckets))
                    .map(([mediaType, value]) => {
                      const buckets = (value as any).buckets || [];

                      if (!buckets.length) {
                        return null;
                      }

                      return (
                        <Grid item xs={12} key={mediaType}>
                          <Box sx={{ backgroundColor: 'text.disabled', p: 0.25, borderRadius: 1 }}>
                            <Typography variant="body1" sx={{ mb: 0.5, ml: 0.5 }}>
                              <strong>{mediaType}</strong>
                            </Typography>
                            <Grid container spacing={0.2}>
                              <Grid item xs={3}>
                                <Paper sx={{ height: 1, borderRadius: 1, display: 'flex', justifyContent: 'center' }}>
                                  <Typography variant="h3">Bucket</Typography>
                                </Paper>
                              </Grid>
                              <Grid item xs={3}>
                                <Paper sx={{ height: 1, borderRadius: 1, display: 'flex', justifyContent: 'center' }}>
                                  <Typography variant="h3">Precision</Typography>
                                </Paper>
                              </Grid>
                              <Grid item xs={2}>
                                <Paper sx={{ height: 1, borderRadius: 1, display: 'flex', justifyContent: 'center' }}>
                                  <Typography variant="h3">Min</Typography>
                                </Paper>
                              </Grid>
                              <Grid item xs={2}>
                                <Paper sx={{ height: 1, borderRadius: 1, display: 'flex', justifyContent: 'center' }}>
                                  <Typography variant="h3">Max</Typography>
                                </Paper>
                              </Grid>
                              <Grid item xs={2}>
                                <Paper sx={{ height: 1, borderRadius: 1, display: 'flex', justifyContent: 'center' }}>
                                  <Typography variant="h3">Increment</Typography>
                                </Paper>
                              </Grid>

                              {buckets.map((bucket: IPrebidConfigPriceBucket, index: number) => (
                                <React.Fragment key={`${mediaType}-${index}`}>
                                  <Grid item xs={3}>
                                    <Paper sx={{ height: 1, borderRadius: 1, display: 'flex', justifyContent: 'center' }}>
                                      <Typography variant="body1">
                                        {mediaType} #{index + 1}
                                      </Typography>
                                    </Paper>
                                  </Grid>
                                  <Grid item xs={3}>
                                    <Paper sx={{ height: 1, borderRadius: 1, display: 'flex', justifyContent: 'center' }}>
                                      <Typography variant="body1">{bucket.precision ?? 2}</Typography>
                                    </Paper>
                                  </Grid>
                                  <Grid item xs={2}>
                                    <Paper sx={{ height: 1, borderRadius: 1, display: 'flex', justifyContent: 'center' }}>
                                      <Typography variant="body1">{bucket.min}</Typography>
                                    </Paper>
                                  </Grid>
                                  <Grid item xs={2}>
                                    <Paper sx={{ height: 1, borderRadius: 1, display: 'flex', justifyContent: 'center' }}>
                                      <Typography variant="body1">{bucket.max}</Typography>
                                    </Paper>
                                  </Grid>
                                  <Grid item xs={2}>
                                    <Paper sx={{ height: 1, borderRadius: 1, display: 'flex', justifyContent: 'center' }}>
                                      <Typography variant="body1">{bucket.increment}</Typography>
                                    </Paper>
                                  </Grid>
                                </React.Fragment>
                              ))}
                            </Grid>
                          </Box>
                        </Grid>
                      );
                    })}
                </Grid>
              )}
            </Box>
          )}


          <Grid container spacing={2}>
            {Object.entries(mediaTypePriceGranularity)
              .filter(([, value]) => value && Array.isArray((value as any).buckets))
              .map(([mediaType, value]) => {
                const buckets = (value as any).buckets || [];
                if (!buckets.length) return null;

                return (
                  <Grid size={{ xs: 12 }} key={mediaType}>
                    <Box sx={{ backgroundColor: 'text.disabled', p: 0.25, borderRadius: 1 }}>
                      <Typography variant="body1" sx={{ mb: 0.5, ml: 0.5 }}>
                        <strong>{mediaType}</strong>
                      </Typography>
                      <BucketTable buckets={buckets} type={mediaType} />
                    </Box>
                  </Grid>
                );
              })}
          </Grid>
        </Box>
      )}

      <Grid container spacing={2} sx={{ width: '100%' }}>
        {/* Summary Stats */}
        {(() => {
          if (['auto', 'dense', 'custom', 'medium', 'high'].includes(priceGranularity)) {
            return (
              <React.Fragment>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1">
                    <strong>Min: </strong> {(defaultBuckets[priceGranularity] || (customPriceBucket?.buckets as any))?.[0]?.min}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1">
                    <strong>Max: </strong> {(defaultBuckets[priceGranularity] || customPriceBucket?.buckets)?.[0]?.max}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1">
                    <strong>Precision: </strong>
                    {(defaultBuckets[priceGranularity] || customPriceBucket?.buckets)?.[0]?.precision || 2}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1">
                    <strong>Increment: </strong> {(defaultBuckets[priceGranularity] || customPriceBucket?.buckets)?.[0]?.increment}
                  </Typography>
                </Grid>
              </React.Fragment>
            );
          }
        })()}

        <Grid size={{ xs: 12 }}>
          <PriceGranularityTable priceGranularity={priceGranularity} customPriceBucket={customPriceBucket as any} />
        </Grid>
      </Grid>
    </ExpandableTile>
  );
};

const HeaderCell = ({ children }: { children: React.ReactNode }) => (
  <Grid size={{ xs: 3 }}>
    <Paper sx={{ height: 1, borderRadius: 1, display: 'flex', justifyContent: 'center' }}>
      <Typography variant="h3">{children}</Typography>
    </Paper>
  </Grid>
);
const HeaderCellSmall = ({ children }: { children: React.ReactNode }) => (
  <Grid size={{ xs: 2 }}>
    <Paper sx={{ height: 1, borderRadius: 1, display: 'flex', justifyContent: 'center' }}>
      <Typography variant="h3">{children}</Typography>
    </Paper>
  </Grid>
);
const BodyCell = ({ children }: { children: React.ReactNode }) => (
  <Grid size={{ xs: 3 }}>
    <Paper sx={{ height: 1, borderRadius: 1, display: 'flex', justifyContent: 'center' }}>
      <Typography variant="body1">{children}</Typography>
    </Paper>
  </Grid>
);
const BodyCellSmall = ({ children }: { children: React.ReactNode }) => (
  <Grid size={{ xs: 2 }}>
    <Paper sx={{ height: 1, borderRadius: 1, display: 'flex', justifyContent: 'center' }}>
      <Typography variant="body1">{children}</Typography>
    </Paper>
  </Grid>
);

const BucketTable = ({ buckets, type }: { buckets: IPrebidConfigPriceBucket[]; type?: string }) => {
  return (
    <Grid container spacing={0.2}>
      <HeaderCell>Bucket</HeaderCell>
      <HeaderCell>Precision</HeaderCell>
      <HeaderCellSmall>Min</HeaderCellSmall>
      <HeaderCellSmall>Max</HeaderCellSmall>
      <HeaderCellSmall>Increment</HeaderCellSmall>

      {buckets.map((bucket: IPrebidConfigPriceBucket, index: number) => (
        <React.Fragment key={`${type}-${index}`}>
          <BodyCell>{type ? `${type} #${index + 1}` : `Bucket #${index + 1}`}</BodyCell>
          <BodyCell>{bucket.precision ?? 2}</BodyCell>
          <BodyCellSmall>{bucket.min}</BodyCellSmall>
          <BodyCellSmall>{bucket.max}</BodyCellSmall>
          <BodyCellSmall>{bucket.increment}</BodyCellSmall>
        </React.Fragment>
      ))}
    </Grid>
  );
};

const PriceGranularityTable = ({ priceGranularity, customPriceBucket }: IPriceGranularityComponentProps) => {
  const [rows, setRows] = React.useState<IPrebidConfigPriceBucket[]>([]);
  useEffect(() => {
    const rows = defaultBuckets[priceGranularity] || customPriceBucket?.buckets || [];
    setRows(rows);
  }, [priceGranularity, customPriceBucket?.buckets]);

  return (
    <Box sx={{ backgroundColor: 'text.disabled', p: 0.25, borderRadius: 1 }}>
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
