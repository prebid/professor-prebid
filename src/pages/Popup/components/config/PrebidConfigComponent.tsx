import React from 'react';
import { IPrebidConfig } from '../../../../inject/scripts/prebid';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import { tileHeight } from './ConfigComponent';

const PrebidConfigComponent = ({ config }: IPrebidConfigComponentProps): JSX.Element => {
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
              <SettingsApplicationsIcon />
            </Avatar>
          }
          title={<Typography variant="h3">Prebid Config</Typography>}
          subheader={<Typography variant="subtitle1">Timeouts and more...</Typography>}
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
            <Grid item xs={12} sm={expanded ? 6 : 12}>
              <Typography variant="body1">
                <strong> Bidder Sequence: </strong>
                {config.bidderSequence}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={expanded ? 6 : 12}>
              <Typography variant="body1">
                <strong> Bidder Timeout: </strong>
                {config.bidderTimeout}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={expanded ? 6 : 12}>
              <Typography variant="body1">
                <strong> Send All Bids:</strong> {String(config.enableSendAllBids)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={expanded ? 6 : 12}>
              <Typography variant="body1">
                <strong> Timeout Buffer: </strong>
                {config.timeoutBuffer}
              </Typography>
            </Grid>
            {expanded && (
              <Grid item xs={12} sm={expanded ? 6 : 12}>
                <Typography variant="body1">
                  <strong> Max Nested Iframes:</strong> {config.maxNestedIframes}
                </Typography>
              </Grid>
            )}
            {expanded && (
              <Grid item xs={12} sm={expanded ? 6 : 12}>
                <Typography variant="body1">
                  <strong> Use Bid Cache:</strong> {String(config.useBidCache)}
                </Typography>
              </Grid>
            )}
            {expanded && (
              <Grid item xs={12} sm={expanded ? 6 : 12}>
                <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                  <strong> Bid Cache Url:</strong> {config.cache?.url}
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

interface IPrebidConfigComponentProps {
  config: IPrebidConfig;
}

export default PrebidConfigComponent;
