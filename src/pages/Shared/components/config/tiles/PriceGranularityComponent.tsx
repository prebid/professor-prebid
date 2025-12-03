import React, { useEffect, useContext } from 'react';
import { IPrebidConfigPriceBucket } from '../../../../Injected/prebid';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { tileHeight } from '../ConfigComponent';
import StraightenIcon from '@mui/icons-material/Straighten';
import Box from '@mui/system/Box';
import AppStateContext from '../../../contexts/appStateContext';

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
  const [expanded, setExpanded] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState<2 | 4 | 6 | 8 | 10 | 12>(4);
  const ref = React.useRef<HTMLInputElement>(null);

  const handleExpandClick = () => {
    setExpanded(!expanded);
    setMaxWidth(expanded ? 4 : 8);
    setTimeout(() => ref.current.scrollIntoView({ behavior: 'smooth' }), 150);
  };

  const hasMediaTypePriceGranularityBuckets = (() => {
    if (!mediaTypePriceGranularity) {
      return false;
    }

    const typedMediaTypePg = mediaTypePriceGranularity as Record<string, { buckets?: IPrebidConfigPriceBucket[] }>;

    return Object.values(typedMediaTypePg).some((value) => Array.isArray(value.buckets) && value.buckets.length > 0);
  })();

  return (
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
            {!expanded &&
              (() => {
                if (['auto', 'dense', 'custom', 'medium', 'high'].includes(priceGranularity)) {
                  return (
                    <React.Fragment>
                      <Grid item xs={12} sm={expanded ? 3 : 6}>
                        <Typography variant="body1">
                          <strong>Min: </strong> {(defaultBuckets[priceGranularity] || customPriceBucket?.buckets)[0].min}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={expanded ? 3 : 6}>
                        <Typography variant="body1">
                          <strong>Max: </strong> {(defaultBuckets[priceGranularity] || customPriceBucket?.buckets)[0].max}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={expanded ? 3 : 6}>
                        <Typography variant="body1">
                          <strong>Precision: </strong>
                          {(defaultBuckets[priceGranularity] || customPriceBucket?.buckets)[0].precision || 2}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={expanded ? 3 : 6}>
                        <Typography variant="body1">
                          <strong>Increment: </strong> {(defaultBuckets[priceGranularity] || customPriceBucket?.buckets)[0].increment}
                        </Typography>
                      </Grid>
                      {(defaultBuckets[priceGranularity] || customPriceBucket?.buckets)?.length > 1 && (
                        <Grid item xs={12} sm={expanded ? 4 : 12}>
                          <Typography variant="body2">
                            + {(defaultBuckets[priceGranularity] || customPriceBucket?.buckets)?.length - 1} more price buckets...
                          </Typography>
                        </Grid>
                      )}
                    </React.Fragment>
                  );
                }
              })()}
            <Grid item xs={12}>
              {expanded && <PriceGranularityTable priceGranularity={priceGranularity} customPriceBucket={customPriceBucket}></PriceGranularityTable>}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

const PriceGranularityTable = ({ priceGranularity, customPriceBucket }: IPriceGranularityComponentProps) => {
  const [type, setType] = React.useState<string>();
  const [rows, setRows] = React.useState<IPrebidConfigPriceBucket[]>([]);
  useEffect(() => {
    const type = priceGranularity;
    setType(type);
    const rows = defaultBuckets[type] || customPriceBucket?.buckets || [];
    setRows(rows);
  }, [priceGranularity, customPriceBucket?.buckets]);

  return (
    <Box sx={{ backgroundColor: 'text.disabled', p: 0.25, borderRadius: 1 }}>
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

        {rows.map((row, index) => {
          return (
            <React.Fragment key={index}>
              <Grid xs={3} item>
                <Paper sx={{ height: 1, borderRadius: 1, display: 'flex', justifyContent: 'center' }}>
                  <Typography variant="body1">
                    {type} #{index + 1}
                  </Typography>
                </Paper>
              </Grid>
              <Grid xs={3} item>
                <Paper sx={{ height: 1, borderRadius: 1, display: 'flex', justifyContent: 'center' }}>
                  <Typography variant="body1">{row.precision || 2}</Typography>
                </Paper>
              </Grid>
              <Grid xs={2} item>
                <Paper sx={{ height: 1, borderRadius: 1, display: 'flex', justifyContent: 'center' }}>
                  <Typography variant="body1">{row.min}</Typography>
                </Paper>
              </Grid>
              <Grid xs={2} item>
                <Paper sx={{ height: 1, borderRadius: 1, display: 'flex', justifyContent: 'center' }}>
                  <Typography variant="body1">{row.max}</Typography>
                </Paper>
              </Grid>
              <Grid xs={2} item>
                <Paper sx={{ height: 1, borderRadius: 1, display: 'flex', justifyContent: 'center' }}>
                  <Typography variant="body1">{row.increment}</Typography>
                </Paper>
              </Grid>
            </React.Fragment>
          );
        })}
      </Grid>
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
