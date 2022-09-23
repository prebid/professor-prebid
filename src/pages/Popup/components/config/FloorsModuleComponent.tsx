import React from 'react';
import { IPrebidConfig } from '../../../../inject/scripts/prebid';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import { tileHeight } from './ConfigComponent';
import JSONViewerComponent from '../../../Shared/JSONViewerComponent';
import BorderBottomIcon from '@mui/icons-material/BorderBottom';
import CardContent from '@mui/material/CardContent';

const FloorsModuleComponent = ({ floors }: IFloorsModuleComponentProps): JSX.Element => {
  const [expanded, setExpanded] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState<4 | 8>(4);
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
              <BorderBottomIcon />
            </Avatar>
          }
          title={<Typography variant="h3">Floors Module</Typography>}
          subheader={<Typography variant="subtitle1">Dynamic Floors</Typography>}
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
            {floors.auctionDelay !== undefined && (
              <Grid item xs={12} sm={expanded ? 4 : 12}>
                <Typography variant="body1">
                  <strong>Auction Delay:</strong> {floors.auctionDelay}
                </Typography>
              </Grid>
            )}
            {floors.data?.currency !== undefined && (
              <Grid item xs={12} sm={expanded ? 4 : 12}>
                <Typography variant="body1">
                  <strong>Currency:</strong> {floors.data?.currency}
                </Typography>
              </Grid>
            )}
            {expanded && floors.data?.floorsSchemaVersion !== undefined && (
              <Grid item xs={12} sm={expanded ? 4 : 12}>
                <Typography variant="body1">
                  <strong>Schema Version:</strong> {floors.data?.floorsSchemaVersion}
                </Typography>
              </Grid>
            )}
            {floors.data?.modelGroups !== undefined && (
              <Grid item xs={12} sm={expanded ? 4 : 12}>
                <Typography variant="body1">
                  <strong># Model Groups:</strong> {floors.data?.modelGroups.length}
                </Typography>
              </Grid>
            )}
            {floors.floorProvider !== undefined && (
              <Grid item xs={12} sm={expanded ? 4 : 12}>
                <Typography variant="body1">
                  <strong>Floor Provider:</strong> {floors.floorProvider}
                </Typography>
              </Grid>
            )}
            {expanded && floors.data?.modelTimestamp !== undefined && (
              <Grid item xs={12} sm={expanded ? 4 : 12}>
                <Typography variant="body1">
                  <strong>Model Timestamp:</strong> {floors.data?.modelTimestamp}
                </Typography>
              </Grid>
            )}
            {expanded && floors.data?.modelWeightSum !== undefined && (
              <Grid item xs={12} sm={expanded ? 6 : 6}>
                <Typography variant="body1">
                  <strong>Model WeightSum:</strong> {floors.data?.modelWeightSum}
                </Typography>
              </Grid>
            )}
            {expanded && floors.endpoint !== undefined && (
              <Grid item xs={12} sm={expanded ? 6 : 12}>
                <Typography variant="body1">
                  <strong>Endpoint Url:</strong> {floors.endpoint?.url}
                </Typography>
              </Grid>
            )}
            {expanded && floors.enforcement !== undefined && (
              <Grid item xs={12} sm={expanded ? 4 : 12}>
                <Typography variant="body1">
                  <strong>Enforcement Floor Deals:</strong> {String(floors.enforcement.floorDeals)}
                </Typography>
              </Grid>
            )}
            {expanded && (
              <Grid item xs={12}>
                <JSONViewerComponent
                  src={floors}
                  name={false}
                  collapsed={false}
                  displayObjectSize={false}
                  displayDataTypes={false}
                  sortKeys={false}
                  quotesOnKeys={false}
                  indentWidth={2}
                  collapseStringsAfterLength={100}
                  style={{ fontSize: '12px', fontFamily: 'roboto', padding: '15px' }}
                />
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

interface IFloorsModuleComponentProps {
  floors: IPrebidConfig['floors'];
}

export default FloorsModuleComponent;
