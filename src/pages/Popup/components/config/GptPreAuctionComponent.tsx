import React from 'react';
import { IPrebidConfig } from '../../../../inject/scripts/prebid';
import Typography from '@mui/material/Typography';
import logger from '../../../../logger';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import { tileHeight } from './ConfigComponent';
import ReactJson from 'react-json-view';
import BorderBottomIcon from '@mui/icons-material/BorderBottom';

const GptPreAuctionComponent = ({ gptPreAuction }: IGptPreAuctionComponentProps): JSX.Element => {
  const [expanded, setExpanded] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState<4 | 8>(4);
  const ref = React.useRef<HTMLInputElement>(null);

  const handleExpandClick = () => {
    setExpanded(!expanded);
    setMaxWidth(expanded ? 4 : 4);
    setTimeout(() => ref.current.scrollIntoView({ behavior: 'smooth' }), 150);
  };
  logger.log(`[PopUp][GptPreAuctionModule]: render `, gptPreAuction);
  return (
    <Grid item md={maxWidth} xs={12} ref={ref}>
      <Card sx={{ width: 1, minHeight: tileHeight }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <BorderBottomIcon />
            </Avatar>
          }
          title={<Typography variant="h3">Gpt Pre-Auction Module</Typography>}
          subheader={<Typography variant="subtitle1">...</Typography>}
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
            <Grid item xs={12} sm={expanded ? 4 : 12}>
              <Typography variant="body1">
                <strong>mcmEnabled:</strong> {String(gptPreAuction.mcmEnabled)}
              </Typography>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <ReactJson
              src={gptPreAuction}
              name={false}
              collapsed={false}
              enableClipboard={false}
              displayObjectSize={false}
              displayDataTypes={false}
              sortKeys={false}
              quotesOnKeys={false}
              indentWidth={2}
              collapseStringsAfterLength={100}
              style={{ fontSize: '12px', fontFamily: 'roboto', padding: '15px' }}
            />
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

interface IGptPreAuctionComponentProps {
  gptPreAuction: IPrebidConfig['gptPreAuction'];
}

export default GptPreAuctionComponent;
