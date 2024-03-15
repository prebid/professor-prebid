import React, { useContext } from 'react';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import { tileHeight } from '../ConfigComponent';
import BorderBottomIcon from '@mui/icons-material/BorderBottom';
import AppStateContext from '../../../contexts/appStateContext';
import RenderKeyValueComponent from '../../RenderKeyValueComponent';

const InstalledModulesComponent = (): JSX.Element => {
  const [expanded, setExpanded] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState<4 | 8>(4);
  const ref = React.useRef<HTMLInputElement>(null);

  const { prebid } = useContext(AppStateContext);
  const { installedModules } = prebid;
  if (!installedModules || !Array.isArray(installedModules)) return null;

  const bidAdapters = installedModules.filter((module) => module.includes('BidAdapter')).sort();
  const analyticsAdapters = installedModules.filter((module) => module.includes('AnalyticsAdapter')).sort();
  const idSystems = installedModules.filter((module) => module.includes('IdSystem')|| module.includes('UserID')).sort();
  const miscellaneous = installedModules.filter(
    (module) => !module.includes('BidAdapter') && !module.includes('AnalyticsAdapter') && !module.includes('IdSystem')
  ).sort();

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
              <BorderBottomIcon />
            </Avatar>
          }
          title={<Typography variant="h3">Installed Modules</Typography>}
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
            {!expanded && (
              <RenderKeyValueComponent
                label="Bid Adapters"
                value={bidAdapters.length > 4 ? [...bidAdapters.slice(0, 4), '...'] : bidAdapters}
                columns={[12, 12]}
                expanded={expanded}
              />
            )}
            {expanded && (
              <>
                {bidAdapters && <RenderKeyValueComponent label="Bid Adapters" value={bidAdapters} columns={[12, 12]} expanded={expanded} />}
                {analyticsAdapters && (
                  <RenderKeyValueComponent label="Analytics Adapters" value={analyticsAdapters} columns={[12, 12]} expanded={expanded} />
                )}
                {idSystems && <RenderKeyValueComponent label="Id Systems" value={idSystems} columns={[12, 12]} expanded={expanded} />}
                {miscellaneous && <RenderKeyValueComponent label="Miscellaneous" value={miscellaneous} columns={[12, 12]} expanded={expanded} />}
              </>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default InstalledModulesComponent;
