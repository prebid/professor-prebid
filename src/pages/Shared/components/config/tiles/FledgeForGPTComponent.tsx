import React, { useContext } from 'react';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import { gte } from 'semver';
import { tileHeight } from '../ConfigComponent';
import BorderBottomIcon from '@mui/icons-material/BorderBottom';
import AppStateContext from '../../../contexts/appStateContext';
import RenderKeyValueComponent from '../../RenderKeyValueComponent';

const FledgeForGPTComponent = (): JSX.Element => {
  const [expanded, setExpanded] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState<4 | 8>(4);
  const ref = React.useRef<HTMLInputElement>(null);

  const { prebid } = useContext(AppStateContext);
  const {
    config: { fledgeForGpt },
  } = prebid;

  const handleExpandClick = () => {
    setExpanded(!expanded);
    setMaxWidth(expanded ? 4 : 4);
    setTimeout(() => ref.current.scrollIntoView({ behavior: 'smooth' }), 150);
  };

  if (!fledgeForGpt) return null;
  return (
    <Grid item sm={maxWidth} xs={12} ref={ref}>
      <Card sx={{ width: 1, minHeight: tileHeight, maxHeight: expanded ? 'unset' : tileHeight }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <BorderBottomIcon />
            </Avatar>
          }
          title={<Typography variant="h3">Fledge For GPT Module</Typography>}
          subheader={
            <Typography variant="subtitle1">
              {!expanded && <RenderKeyValueComponent label="Enabled" value={fledgeForGpt.enabled} columns={[12, 12]} expanded={expanded} />}
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
                label="Default For Slots"
                value={fledgeForGpt.defaultForSlots || 'undefined'}
                columns={[12, 12]}
                expanded={expanded}
              />
            )}
            {!expanded && (
              <RenderKeyValueComponent label="Bidders" value={fledgeForGpt.bidders || 'all bidders'} columns={[12, 12]} expanded={expanded} />
            )}
            {expanded && <RenderKeyValueComponent label="Module Configuration" value={fledgeForGpt} columns={[12, 12]} expanded={expanded} />}
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default FledgeForGPTComponent;
