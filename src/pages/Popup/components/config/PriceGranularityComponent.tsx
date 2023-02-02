import React, { useEffect } from 'react';
import { IPrebidConfigPriceBucket } from '../../../../inject/scripts/prebid';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { tileHeight } from './ConfigComponent';
import StraightenIcon from '@mui/icons-material/Straighten';
import { Box } from '@mui/system';

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

export const PriceGranularityCard = ({ priceGranularity, customPriceBucket, mediaTypePriceGranularity }: IPriceGranularityComponentProps) => {
  const [expanded, setExpanded] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState<2 | 4 | 6 | 8 | 10 | 12>(4);
  const ref = React.useRef<HTMLInputElement>(null);

  const hasCustomPriceBucket = Object.keys(customPriceBucket).length > 0;
  const hasMediaTypePriceGranularity = Object.keys(mediaTypePriceGranularity).length > 0;
  const handleExpandClick = () => {
    setExpanded(!expanded);
    setMaxWidth(expanded ? 4 : 8);
    setTimeout(() => ref.current.scrollIntoView({ behavior: 'smooth' }), 150);
  };

  return (
    <Grid item md={maxWidth} xs={12} ref={ref}>
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
              {priceGranularity &&
                !hasCustomPriceBucket &&
                !hasMediaTypePriceGranularity &&
                (Object.keys(defaultBuckets).includes(priceGranularity) ? 'default' : 'custom')}
              {hasCustomPriceBucket && `Custom Price Buckets`}
              {hasMediaTypePriceGranularity && `MediaType PriceGranularity`}
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
          <Grid container spacing={1}>
            {['auto', 'dense', 'custom', 'medium', 'high'].includes(priceGranularity) && !expanded && (
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
                {(defaultBuckets[priceGranularity] || customPriceBucket?.buckets).length > 1 && (
                  <Grid item xs={12} sm={expanded ? 4 : 12}>
                    <Typography variant="body2">
                      + {(defaultBuckets[priceGranularity] || customPriceBucket?.buckets).length - 1} more price buckets...
                    </Typography>
                  </Grid>
                )}
              </React.Fragment>
            )}
            {hasMediaTypePriceGranularity &&
              !expanded &&
              Object.keys(mediaTypePriceGranularity)
                .slice(0, 1)
                .map((mediaType, index) => (
                  <React.Fragment key={index}>
                    <Grid item xs={12}>
                      <Typography variant="body1">
                        <strong>MediaType: </strong> {mediaType}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={expanded ? 3 : 6}>
                      <Typography variant="body1">
                        <strong>Min: </strong> {mediaTypePriceGranularity[mediaType as 'native' | 'banner' | 'video'].buckets[0].min}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={expanded ? 3 : 6}>
                      <Typography variant="body1">
                        <strong>Max: </strong> {mediaTypePriceGranularity[mediaType as 'native' | 'banner' | 'video'].buckets[0].max}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={expanded ? 3 : 6}>
                      <Typography variant="body1">
                        <strong>Precision: </strong>
                        {mediaTypePriceGranularity[mediaType as 'native' | 'banner' | 'video'].buckets[0].precision || 2}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={expanded ? 3 : 6}>
                      <Typography variant="body1">
                        <strong>Increment: </strong> {mediaTypePriceGranularity[mediaType as 'native' | 'banner' | 'video'].buckets[0].increment}
                      </Typography>
                    </Grid>
                    {(defaultBuckets[priceGranularity] || customPriceBucket?.buckets).length > 1 && (
                      <Grid item xs={12} sm={expanded ? 4 : 12}>
                        <Typography variant="body2">
                          + {(defaultBuckets[priceGranularity] || customPriceBucket?.buckets).length - 1} more price buckets...
                        </Typography>
                      </Grid>
                    )}
                  </React.Fragment>
                ))}
            {expanded && (
              <Grid item xs={12}>
                <PriceGranularityComponent
                  priceGranularity={priceGranularity}
                  customPriceBucket={customPriceBucket}
                  mediaTypePriceGranularity={mediaTypePriceGranularity}
                ></PriceGranularityComponent>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

const BucketRow = ({ row, index, type }: IBucketRowProps) => {
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
};

export const PriceGranularityComponent = ({ priceGranularity, customPriceBucket, mediaTypePriceGranularity }: IPriceGranularityComponentProps) => {
  const [type, setType] = React.useState<string>();
  const [rows, setRows] = React.useState<IPrebidConfigPriceBucket[]>([]);
  const hasMediaTypePriceGranularity = Object.keys(mediaTypePriceGranularity).length > 0;

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
        {rows.map((row, index) => (
          <BucketRow row={row} index={index} type={type} key={index} />
        ))}
      </Grid>
      {hasMediaTypePriceGranularity && (
        <React.Fragment>
          {Object.keys(mediaTypePriceGranularity).map((mediaType, index) => (
            <Grid container spacing={0.2} key={index}>
              <Grid item xs={12}>
                <Paper sx={{ height: 1, borderRadius: 1, display: 'flex', justifyContent: 'center' }}>
                  <Typography variant="body1">
                    <strong>MediaType: </strong> {mediaType}
                  </Typography>
                </Paper>
              </Grid>
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
              {mediaTypePriceGranularity[mediaType as 'native' | 'video' | 'banner'].buckets.map((row, index) => (
                <BucketRow row={row} index={index} type={mediaType} />
              ))}
            </Grid>
          ))}
        </React.Fragment>
      )}
    </Box>
  );
};

interface IPriceGranularityComponentProps {
  priceGranularity: string;
  customPriceBucket: {
    buckets: IPrebidConfigPriceBucket[];
  };
  mediaTypePriceGranularity: {
    banner: { buckets: IPrebidConfigPriceBucket[] };
    native: { buckets: IPrebidConfigPriceBucket[] };
    video: { buckets: IPrebidConfigPriceBucket[] };
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

interface IBucketRowProps {
  row: IPrebidConfigPriceBucket;
  index: number;
  type: string;
}
