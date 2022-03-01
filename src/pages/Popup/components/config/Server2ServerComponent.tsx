import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { IPrebidConfigS2SConfig } from '../../../../inject/scripts/prebid';
import logger from '../../../../logger';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Collapse from '@mui/material/Collapse';
import Avatar from '@mui/material/Avatar';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/styles';
import DnsIcon from '@mui/icons-material/Dns';
import ReactJson from 'react-json-view';
import Grid from '@mui/material/Grid';
import { tileHeight } from './ConfigComponent';

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
}));

const Server2ServerComponent = ({ s2sConfig }: Server2ServerComponentProps): JSX.Element => {
  const [expanded, setExpanded] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState<4 | 8>(4);
  const ref = React.useRef<HTMLInputElement>(null);

  const handleExpandClick = () => {
    setExpanded(!expanded);
    setMaxWidth(expanded ? 4 : 8);
    setTimeout(() => ref.current.scrollIntoView({ behavior: 'smooth' }), 150);
  };

  logger.log(`[PopUp][Server2ServerComponent]: render `, s2sConfig);
  return (
    <Grid item md={maxWidth} xs={12} ref={ref}>
      <Card sx={{ width: 1, minHeight: tileHeight, border: '1px solid #0e86d4' }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: '#0e86d4' }}>
              <DnsIcon />
            </Avatar>
          }
          title="Prebid Server"
          subheader={`s2s Config`}
          action={
            (s2sConfig.app || (s2sConfig.adapterOptions && JSON.stringify(s2sConfig.adapterOptions) !== '{}')) && (
              <ExpandMore expand={expanded} aria-expanded={expanded} aria-label="show more">
                <ExpandMoreIcon />
              </ExpandMore>
            )
          }
          onClick={handleExpandClick}
        />
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            <strong>Account Id:</strong> {s2sConfig.accountId}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Adapter:</strong> {s2sConfig.adapter}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>max. Bids:</strong> {s2sConfig.maxBids}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Timeout:</strong> {s2sConfig.timeout}
          </Typography>
        </CardContent>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent>
            {s2sConfig.app && (
              <Box sx={{ display: 'block' }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>App:</strong>
                </Typography>
                <ReactJson
                  src={s2sConfig.app}
                  name={false}
                  collapsed={false}
                  enableClipboard={false}
                  displayObjectSize={false}
                  displayDataTypes={false}
                  sortKeys={false}
                  quotesOnKeys={false}
                  indentWidth={2}
                  collapseStringsAfterLength={100}
                  style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
                />
              </Box>
            )}
            {s2sConfig.adapterOptions && JSON.stringify(s2sConfig.adapterOptions) !== '{}' && (
              <Box sx={{ display: 'block' }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Adapter Options:</strong>
                </Typography>
                <ReactJson
                  src={s2sConfig.adapterOptions}
                  name={false}
                  collapsed={false}
                  enableClipboard={false}
                  displayObjectSize={false}
                  displayDataTypes={false}
                  sortKeys={false}
                  quotesOnKeys={false}
                  indentWidth={2}
                  collapseStringsAfterLength={100}
                  style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
                />
              </Box>
            )}
            {s2sConfig.syncUrlModifier && JSON.stringify(s2sConfig.syncUrlModifier) !== '{}' && (
              <Box sx={{ display: 'block' }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Sync. Url Modifier:</strong>
                </Typography>
                <ReactJson
                  src={s2sConfig.syncUrlModifier}
                  name={false}
                  collapsed={false}
                  enableClipboard={false}
                  displayObjectSize={false}
                  displayDataTypes={false}
                  sortKeys={false}
                  quotesOnKeys={false}
                  indentWidth={2}
                  collapseStringsAfterLength={100}
                  style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
                />
              </Box>
            )}
          </CardContent>
        </Collapse>
      </Card>
    </Grid>
  );
};

interface Server2ServerComponentProps {
  s2sConfig: IPrebidConfigS2SConfig;
}

export default Server2ServerComponent;
