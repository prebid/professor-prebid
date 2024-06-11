import React, { useContext } from 'react';
import Typography from '@mui/material/Typography';
import { IPrebidConfigS2SConfig } from '../../../../Injected/prebid';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DnsIcon from '@mui/icons-material/Dns';
import Grid from '@mui/material/Grid';
import { tileHeight } from '../ConfigComponent';
import RenderKeyValueComponent from '../../RenderKeyValueComponent';
import AppStateContext from '../../../contexts/appStateContext';

const RenderPrebidServerComponent = ({
  s2sConfig: { accountId, adapter, bidders, defaultTtl, enabled, maxBids, timeout, app, adapterOptions, endpoint, syncEndpoint, syncUrlModifier },
}: {
  s2sConfig: IPrebidConfigS2SConfig;
}): JSX.Element => {
  const [expanded, setExpanded] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState<4 | 8>(4);
  const ref = React.useRef<HTMLInputElement>(null);

  const handleExpandClick = () => {
    setExpanded(!expanded);
    setMaxWidth(expanded ? 4 : 8);
    setTimeout(() => ref.current.scrollIntoView({ behavior: 'smooth' }), 150);
  };

  return (
    <Grid item sm={maxWidth} xs={12} ref={ref}>
      <Card sx={{ width: 1, minHeight: tileHeight, maxHeight: expanded ? 'unset' : tileHeight }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <DnsIcon />
            </Avatar>
          }
          title={<Typography variant="h3">Prebid Server</Typography>}
          subheader={<Typography variant="subtitle1">Prebid Server Config, ...</Typography>}
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
            <RenderKeyValueComponent columns={[12, 12]} label="Account Id" value={accountId} expanded={expanded} />
            <RenderKeyValueComponent columns={[4, 6]} label="Adapter" value={adapter} expanded={expanded} />
            <RenderKeyValueComponent columns={[12, 12]} label="Bidders" value={bidders} expanded={expanded} />
            <RenderKeyValueComponent columns={[4, 6]} label="Default TTL" value={defaultTtl} expanded={expanded} />
            <RenderKeyValueComponent columns={[4, 6]} label="Enabled" value={enabled} expanded={expanded} />
            <RenderKeyValueComponent columns={[4, 6]} label="Max Bids" value={maxBids} expanded={expanded} />
            <RenderKeyValueComponent columns={[4, 12]} label="Timeout" value={timeout} expanded={expanded} />
            <RenderKeyValueComponent columns={[4, 12]} label="App" value={app} expanded={expanded} />
            <RenderKeyValueComponent columns={[4, 12]} label="Adapter Options" value={adapterOptions} expanded={expanded} />
            <RenderKeyValueComponent columns={[12, 12]} label="Endpoint" value={endpoint} expanded={expanded} />
            <RenderKeyValueComponent columns={[4, 12]} label="Sync Endpoint" value={syncEndpoint} expanded={expanded} />
            <RenderKeyValueComponent columns={[4, 12]} label="Sync Url Modifier" value={syncUrlModifier} expanded={expanded} />
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

const PrebidServerComponent = (): JSX.Element => {
  const { prebid } = useContext(AppStateContext);
  const {
    config: { s2sConfig },
  } = prebid;
  if (s2sConfig && Array.isArray(s2sConfig)) {
    return (
      <>
        {s2sConfig.map((s2sConfig, index) => (
          <RenderPrebidServerComponent s2sConfig={s2sConfig} key={index} />
        ))}
      </>
    );
  } else if (s2sConfig) {
    return <RenderPrebidServerComponent s2sConfig={s2sConfig as IPrebidConfigS2SConfig} />;
  } else {
    return null;
  }
};

export default PrebidServerComponent;
