import React, { useContext } from 'react';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import { tileHeight } from '../ConfigComponent';
import AppStateContext from '../../../contexts/appStateContext';
import RenderKeyValueComponent from '../../RenderKeyValueComponent';

const UserSyncComponent = (): JSX.Element => {
  const [expanded, setExpanded] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState<4 | 8>(4);
  const ref = React.useRef<HTMLInputElement>(null);

  const { prebid } = useContext(AppStateContext);
  const { config } = prebid;
  if (!config?.userSync) return null;

  const handleExpandClick = () => {
    setExpanded(!expanded);
    setMaxWidth(expanded ? 4 : 4);
    setTimeout(() => ref.current.scrollIntoView({ behavior: 'smooth' }), 150);
  };

  return (
    <Grid item sm={maxWidth} xs={12} ref={ref}>
      <Card sx={{ width: 1, minHeight: tileHeight, maxHeight: expanded ? 'unset' : tileHeight }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <PeopleOutlinedIcon />
            </Avatar>
          }
          title={<Typography variant="h3">User Sync</Typography>}
          subheader={
            <Typography variant="subtitle1">
              {/* {!expanded && <RenderKeyValueComponent label="Enabled" value={fledgeForGpt.enabled} columns={[12, 12]} expanded={expanded} />} */}
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
            <RenderKeyValueComponent
              label="User Sync"
              value={config?.userSync}
              columns={[12, 12]}
              expanded={expanded}
            />
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default UserSyncComponent;
