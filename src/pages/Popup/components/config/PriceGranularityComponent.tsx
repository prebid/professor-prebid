import React, { useEffect } from 'react';
import { IPrebidDetails, IPrebidConfigPriceBucket } from '../../../../inject/scripts/prebid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import logger from '../../../../logger';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import Avatar from '@mui/material/Avatar';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Typography from '@mui/material/Typography';
import EuroSharpIcon from '@mui/icons-material/EuroSharp';
import { styled } from '@mui/styles';
import Grid from '@mui/material/Grid';
import { tileHeight } from './ConfigComponent';

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

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
}));

export const PriceGranularityCard = ({ prebid }: IPriceGranularityComponentProps) => {
  const [expanded, setExpanded] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState<2 | 4 | 6 | 8 | 10 | 12>(4);

  const handleExpandClick = () => {
    setExpanded(!expanded);
    setMaxWidth(expanded ? 4 : 8);
  };

  return (
    <Grid item xs={maxWidth}>
      <Card sx={{ width: 1, minHeight: tileHeight, border: '1px solid #0e86d4' }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: '#0e86d4' }} aria-label="recipe">
              <EuroSharpIcon />
            </Avatar>
          }
          title="Price Granularity"
          subheader={`${prebid.config.priceGranularity} (${
            Object.keys(defaultBuckets).includes(prebid.config.priceGranularity) ? 'default' : 'custom'
          })`}
          action={
            <ExpandMore expand={expanded} onClick={handleExpandClick} aria-expanded={expanded} aria-label="show more">
              <ExpandMoreIcon />
            </ExpandMore>
          }
        />
        <Collapse in={!expanded} timeout="auto" unmountOnExit>
          {(() => {
            if (['auto', 'dense', 'custom', 'medium', 'high'].includes(prebid.config.priceGranularity)) {
              return (
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Min: </strong> {(defaultBuckets[prebid.config.priceGranularity] || prebid.config?.customPriceBucket?.buckets)[0].min}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Max: </strong> {(defaultBuckets[prebid.config.priceGranularity] || prebid.config?.customPriceBucket?.buckets)[0].max}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Precision: </strong>
                    {(defaultBuckets[prebid.config.priceGranularity] || prebid.config?.customPriceBucket?.buckets)[0].precision || 2}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Increment: </strong>{' '}
                    {(defaultBuckets[prebid.config.priceGranularity] || prebid.config?.customPriceBucket?.buckets)[0].increment}
                  </Typography>
                  {(defaultBuckets[prebid.config.priceGranularity] || prebid.config?.customPriceBucket?.buckets).length > 1 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}
                    >
                      + {(defaultBuckets[prebid.config.priceGranularity] || prebid.config?.customPriceBucket?.buckets).length - 1} more price
                      buckets...
                    </Typography>
                  )}
                </CardContent>
              );
            }
          })()}
        </Collapse>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent>
            <PriceGranularityComponent prebid={prebid}></PriceGranularityComponent>
          </CardContent>
        </Collapse>
      </Card>
    </Grid>
  );
};

export const PriceGranularityComponent = ({ prebid }: IPriceGranularityComponentProps) => {
  const [type, setType] = React.useState<string>();
  const [rows, setRows] = React.useState<IPrebidConfigPriceBucket[]>([]);
  useEffect(() => {
    const type = prebid.config.priceGranularity;
    setType(type);
    const rows = defaultBuckets[type] || prebid.config?.customPriceBucket?.buckets || [];
    setRows(rows);
  }, [prebid.config.priceGranularity]);

  logger.log(`[PopUp][PriceGranularityComponent]: render `, type, rows);
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell align="left">Bucket</TableCell>
          <TableCell align="left">Precision</TableCell>
          <TableCell align="left">Min</TableCell>
          <TableCell align="left">Max</TableCell>
          <TableCell align="left">Increment</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, index) => {
          return (
            <TableRow key={index + 1} sx={{ verticalAlign: 'top' }}>
              <TableCell align="left" sx={{ width: '40%' }}>
                {type} #{index + 1}
              </TableCell>
              <TableCell align="left" sx={{ width: '15%' }}>
                {row.precision}
              </TableCell>
              <TableCell align="left" sx={{ width: '15%' }}>
                {row.min}
              </TableCell>
              <TableCell align="left" sx={{ width: '15%' }}>
                {row.max}
              </TableCell>
              <TableCell align="left" sx={{ width: '15%' }}>
                {row.increment}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

interface IPriceGranularityComponentProps {
  prebid: IPrebidDetails;
}

interface IDefaultBuckets {
  [key: string]: {
    precision: number;
    min: number;
    max: number;
    increment: number;
  }[];
}
