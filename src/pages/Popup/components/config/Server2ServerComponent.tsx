import React from 'react';
import Typography from '@mui/material/Typography';
import { IPrebidConfigS2SConfig } from '../../../Content/scripts/prebid';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DnsIcon from '@mui/icons-material/Dns';
import JSONViewerComponent from '../../../Shared/components/JSONViewerComponent';
import Grid from '@mui/material/Grid';
import { tileHeight } from './ConfigComponent';

const Server2ServerComponent = ({ s2sConfig }: Server2ServerComponentProps): JSX.Element => {
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
              <DnsIcon />
            </Avatar>
          }
          title={<Typography variant="h3">Prebid Server</Typography>}
          subheader={<Typography variant="subtitle1">s2s Config, ...</Typography>}
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
            {s2sConfig.accountId !== undefined && (
              <Grid item xs={12} sm={expanded ? 12 : 12}>
                <Typography variant="body1">
                  <strong>Account Id: </strong>
                  {s2sConfig.accountId}
                </Typography>
              </Grid>
            )}
            {s2sConfig.adapter !== undefined && (
              <Grid item xs={12} sm={expanded ? 4 : 6}>
                <Typography variant="body1">
                  <strong>Adapter: </strong>
                  {s2sConfig.adapter}
                </Typography>
              </Grid>
            )}
            {s2sConfig.bidders !== undefined && (
              <Grid item xs={12} sm={expanded ? 12 : 6}>
                <Typography variant="body1">
                  <strong>{expanded ? '' : '# '}Bidders: </strong>
                  {expanded ? s2sConfig.bidders.join(', ') : s2sConfig.bidders.length}
                </Typography>
              </Grid>
            )}
            {s2sConfig.defaultTtl !== undefined && (
              <Grid item xs={12} sm={expanded ? 4 : 6}>
                <Typography variant="body1">
                  <strong>Default TTL: </strong>
                  {s2sConfig.defaultTtl}
                </Typography>
              </Grid>
            )}
            {s2sConfig.enabled !== undefined && (
              <Grid item xs={12} sm={expanded ? 4 : 6}>
                <Typography variant="body1">
                  <strong>Enabled: </strong>
                  {String(s2sConfig.enabled)}
                </Typography>
              </Grid>
            )}
            {s2sConfig.maxBids !== undefined && (
              <Grid item xs={12} sm={expanded ? 4 : 6}>
                <Typography variant="body1">
                  <strong>max. Bids:</strong>
                  {s2sConfig.maxBids}
                </Typography>
              </Grid>
            )}
            {expanded && s2sConfig.timeout !== undefined && (
              <Grid item xs={12} sm={expanded ? 4 : 12}>
                <Typography variant="body1">
                  <strong>Timeout: </strong> {s2sConfig.timeout}
                </Typography>
              </Grid>
            )}
            {expanded && s2sConfig.app && (
              <Grid item xs={12} sm={expanded ? 4 : 12}>
                <Typography variant="body1">
                  <strong>App: </strong>
                </Typography>
              </Grid>
            )}
            {expanded && s2sConfig.app && (
              <Grid item xs={12} sm={expanded ? 4 : 12}>
                <JSONViewerComponent
                  src={s2sConfig.app}
                  name={false}
                  collapsed={false}
                  displayObjectSize={false}
                  displayDataTypes={false}
                  sortKeys={false}
                  quotesOnKeys={false}
                  indentWidth={2}
                  collapseStringsAfterLength={100}
                  style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
                />
              </Grid>
            )}
            {expanded && s2sConfig.adapterOptions && JSON.stringify(s2sConfig.adapterOptions) !== '{}' && (
              <Grid item xs={12} sm={expanded ? 4 : 12}>
                <Typography variant="body1">
                  <strong>Adapter Options:</strong>
                </Typography>
              </Grid>
            )}
            {expanded && s2sConfig.adapterOptions && JSON.stringify(s2sConfig.adapterOptions) !== '{}' && (
              <Grid item xs={12}>
                <JSONViewerComponent
                  src={s2sConfig.adapterOptions}
                  name={false}
                  collapsed={false}
                  displayObjectSize={false}
                  displayDataTypes={false}
                  sortKeys={false}
                  quotesOnKeys={false}
                  indentWidth={2}
                  collapseStringsAfterLength={100}
                  style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
                />
              </Grid>
            )}
            {expanded && s2sConfig.endpoint && JSON.stringify(s2sConfig.endpoint) !== '{}' && (
              <Grid item xs={12} sm={expanded ? 4 : 12}>
                <Typography variant="body1">
                  <strong>Endpoint:</strong>
                  {typeof s2sConfig.endpoint === 'string' ? s2sConfig.endpoint : ''}
                </Typography>
              </Grid>
            )}
            {expanded && s2sConfig.endpoint && typeof s2sConfig.endpoint === 'object' && JSON.stringify(s2sConfig.endpoint) !== '{}' && (
              <Grid item xs={12}>
                <JSONViewerComponent
                  src={s2sConfig.endpoint}
                  name={false}
                  collapsed={false}
                  displayObjectSize={false}
                  displayDataTypes={false}
                  sortKeys={false}
                  quotesOnKeys={false}
                  indentWidth={2}
                  collapseStringsAfterLength={100}
                  style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
                />
              </Grid>
            )}
            {expanded && s2sConfig.syncEndpoint && JSON.stringify(s2sConfig.syncEndpoint) !== '{}' && (
              <Grid item xs={12} sm={expanded ? 4 : 12}>
                <Typography variant="body1">
                  <strong>Sync. Endpoint: </strong>
                  {typeof s2sConfig.syncEndpoint === 'string' ? s2sConfig.syncEndpoint : ''}
                </Typography>
              </Grid>
            )}
            {expanded && s2sConfig.syncEndpoint && typeof s2sConfig.syncEndpoint === 'object' && JSON.stringify(s2sConfig.syncEndpoint) !== '{}' && (
              <Grid item xs={12}>
                <JSONViewerComponent
                  src={s2sConfig.syncEndpoint}
                  name={false}
                  collapsed={false}
                  displayObjectSize={false}
                  displayDataTypes={false}
                  sortKeys={false}
                  quotesOnKeys={false}
                  indentWidth={2}
                  collapseStringsAfterLength={100}
                  style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
                />
              </Grid>
            )}
            {expanded && s2sConfig.syncUrlModifier && JSON.stringify(s2sConfig.syncUrlModifier) !== '{}' && (
              <Grid item xs={12} sm={expanded ? 4 : 12}>
                <Typography variant="body1">
                  <strong>Sync. Url Modifier:</strong>
                </Typography>
              </Grid>
            )}
            {expanded && s2sConfig.syncUrlModifier && JSON.stringify(s2sConfig.syncUrlModifier) !== '{}' && (
              <Grid item xs={12}>
                <JSONViewerComponent
                  src={s2sConfig.syncUrlModifier}
                  name={false}
                  collapsed={false}
                  displayObjectSize={false}
                  displayDataTypes={false}
                  sortKeys={false}
                  quotesOnKeys={false}
                  indentWidth={2}
                  collapseStringsAfterLength={100}
                  style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
                />
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

interface Server2ServerComponentProps {
  s2sConfig: IPrebidConfigS2SConfig;
}

export default Server2ServerComponent;
