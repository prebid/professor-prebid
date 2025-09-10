import React, { useContext } from 'react';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import { tileHeight } from '../ConfigComponent';
import RenderKeyValueComponent from '../../RenderKeyValueComponent';
import AppStateContext from '../../../contexts/appStateContext';

const BidderSettingsComponent = (): JSX.Element => {
  const [expanded, setExpanded] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState<4 | 8>(4);

  const { prebid } = useContext(AppStateContext);
  const { bidderSettings } = prebid;
  const ref = React.useRef<HTMLInputElement>(null);

  const handleExpandClick = () => {
    setExpanded(!expanded);
    setMaxWidth(expanded ? 4 : 8);
    setTimeout(() => ref.current.scrollIntoView({ behavior: 'smooth' }), 150);
  };

  if (!bidderSettings) return null;
  return (
    <Grid size={{ xs: 12, sm: maxWidth }} ref={ref}>
      <Card sx={{ width: 1, minHeight: tileHeight, maxHeight: expanded ? 'unset' : tileHeight }}>
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
          <Grid container>
            <RenderKeyValueComponent
              label="StorageAccess: "
              value={
                <>
                  {Object.keys(bidderSettings)
                    .filter((bidder) => bidderSettings[bidder].storageAllowed !== undefined)
                    .slice(0, !expanded ? 7 : Object.keys(bidderSettings).length)
                    .map((bidder) => (
                      <Typography key={bidder} variant="body1">
                        {bidder}: {String(bidderSettings[bidder].storageAllowed)}
                      </Typography>
                    ))}
                </>
              }
              expanded={expanded}
              columns={[6, 12]}
            />
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default BidderSettingsComponent;
