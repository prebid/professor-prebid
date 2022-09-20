import React from 'react';
import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import { tileHeight } from './ConfigComponent';

const BidderSettingsComponent = ({ prebid }: IBidderSettingsComponentProps): JSX.Element => {
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
          title={<Typography variant="h3">Bidder Settings</Typography>}
          subheader={<Typography variant="subtitle1">LocalStorageAccess</Typography>}
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
                <strong> StorageAccess: </strong>
                {Object.keys(prebid.bidderSettings)
                  .slice(0, !expanded ? 7 : Object.keys(prebid.bidderSettings).length)
                  .map((bidder) => (
                    <Typography key={bidder} variant="body1">
                      {bidder}: {String(prebid.bidderSettings[bidder].storageAllowed)}
                    </Typography>
                  ))}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

interface IBidderSettingsComponentProps {
  prebid: IPrebidDetails;
}

export default BidderSettingsComponent;
