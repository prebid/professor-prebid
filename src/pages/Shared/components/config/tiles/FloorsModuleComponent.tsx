import React, { useContext } from 'react';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import { tileHeight } from '../ConfigComponent';
import BorderBottomIcon from '@mui/icons-material/BorderBottom';
import CardContent from '@mui/material/CardContent';
import AppStateContext from '../../../contexts/appStateContext';
import RenderKeyValueComponent from '../../RenderKeyValueComponent';

const FloorsModuleComponent = (): JSX.Element => {
  const { prebid } = useContext(AppStateContext);
  const {
    config: { floors },
  } = prebid;
  const [expanded, setExpanded] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState<4 | 8>(4);
  const ref = React.useRef<HTMLInputElement>(null);

  const handleExpandClick = () => {
    setExpanded(!expanded);
    setMaxWidth(expanded ? 4 : 8);
    setTimeout(() => ref.current.scrollIntoView({ behavior: 'smooth' }), 150);
  };
  if (!floors) return null;
  return (
    <Grid item sm={maxWidth} xs={12} ref={ref}>
      <Card sx={{ width: 1, minHeight: tileHeight, maxHeight: expanded ? 'unset' : tileHeight }}>
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
            <RenderKeyValueComponent label="Auction Delay:" value={floors.auctionDelay} columns={[4, 12]} expanded={expanded} />
            <RenderKeyValueComponent label="Currency:" value={floors.data?.currency} columns={[4, 12]} expanded={expanded} />
            <RenderKeyValueComponent label="Schema Version:" value={floors.data?.floorsSchemaVersion} columns={[4, 12]} expanded={expanded} />
            <RenderKeyValueComponent label="Model Groups:" value={floors.data?.modelGroups?.length} columns={[4, 12]} expanded={expanded} />
            <RenderKeyValueComponent label="Floor Provider:" value={floors.floorProvider} columns={[4, 12]} expanded={expanded} />
            <RenderKeyValueComponent label="Model Timestamp:" value={floors.data?.modelTimestamp} columns={[4, 12]} expanded={expanded} />
            <RenderKeyValueComponent label="Model WeightSum:" value={floors.data?.modelWeightSum} columns={[6, 6]} expanded={expanded} />
            <RenderKeyValueComponent label="Endpoint Url:" value={floors.endpoint?.url} columns={[6, 12]} expanded={expanded} />
            <RenderKeyValueComponent label="Enforcement Floor Deals:" value={floors.enforcement?.floorDeals} columns={[4, 12]} expanded={expanded} />
            <RenderKeyValueComponent label="Floors:" value={floors} columns={[12, 12]} expanded={expanded} />
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default FloorsModuleComponent;
