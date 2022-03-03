import React, { useEffect } from 'react';
import { IPrebidConfigPriceBucket } from '../../../../inject/scripts/prebid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import logger from '../../../../logger';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { tileHeight } from './ConfigComponent';
import StraightenIcon from '@mui/icons-material/Straighten';

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

export const PriceGranularityCard = ({ priceGranularity, customPriceBucket }: IPriceGranularityComponentProps) => {
  const [expanded, setExpanded] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState<2 | 4 | 6 | 8 | 10 | 12>(4);
  const ref = React.useRef<HTMLInputElement>(null);

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
              {priceGranularity} ({Object.keys(defaultBuckets).includes(priceGranularity) ? 'default' : 'custom'})
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
                      {(defaultBuckets[priceGranularity] || customPriceBucket?.buckets).length > 1 && (
                        <Grid item xs={12} sm={expanded ? 4 : 12}>
                          <Typography variant="body2">
                            + {(defaultBuckets[priceGranularity] || customPriceBucket?.buckets).length - 1} more price buckets...
                          </Typography>
                        </Grid>
                      )}
                    </React.Fragment>
                  );
                }
              })()}
            <Grid item xs={12}>
              {expanded && (
                <PriceGranularityComponent priceGranularity={priceGranularity} customPriceBucket={customPriceBucket}></PriceGranularityComponent>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

export const PriceGranularityComponent = ({ priceGranularity, customPriceBucket }: IPriceGranularityComponentProps) => {
  const [type, setType] = React.useState<string>();
  const [rows, setRows] = React.useState<IPrebidConfigPriceBucket[]>([]);
  useEffect(() => {
    const type = priceGranularity;
    setType(type);
    const rows = defaultBuckets[type] || customPriceBucket?.buckets || [];
    setRows(rows);
  }, [priceGranularity, customPriceBucket?.buckets]);

  logger.log(`[PopUp][PriceGranularityComponent]: render `, type, rows);
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell variant="head">
            <Typography variant="h3">Bucket</Typography>
          </TableCell>
          <TableCell variant="head">
            <Typography variant="h3">Precision</Typography>
          </TableCell>
          <TableCell variant="head">
            <Typography variant="h3">Min</Typography>
          </TableCell>
          <TableCell variant="head">
            <Typography variant="h3">Max</Typography>
          </TableCell>
          <TableCell variant="head">
            <Typography variant="h3">Increment</Typography>
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, index) => {
          return (
            <TableRow key={index + 1} sx={{ verticalAlign: 'top' }}>
              <TableCell variant="body" sx={{ w: 0.4 }}>
                <Typography variant="body1">
                  {type} #{index + 1}
                </Typography>
              </TableCell>
              <TableCell variant="body" sx={{ w: 0.15 }}>
                <Typography variant="body1">{row.precision || 2}</Typography>
              </TableCell>
              <TableCell variant="body" sx={{ w: 0.15 }}>
                <Typography variant="body1">{row.min}</Typography>
              </TableCell>
              <TableCell variant="body" sx={{ w: 0.15 }}>
                <Typography variant="body1">{row.max}</Typography>
              </TableCell>
              <TableCell variant="body" sx={{ w: 0.15 }}>
                <Typography variant="body1">{row.increment}</Typography>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
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
