import React from 'react';
import { IPrebidAuctionEndEventData, IPrebidDetails } from '../../../../inject/scripts/prebid';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AppsIcon from '@mui/icons-material/Apps';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import BidReceivedRowComponent from './BidReceivedRowComponent';
import NoBidRowComponent from './NoBidRowComponent';

const BidsComponent = ({ prebid }: IBidsComponentProps): JSX.Element => {
  const [value, setValue] = React.useState(0);
  const [globalOpen, setGlobalOpen] = React.useState(false);
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  const bidsReceived =
    prebid.events
      ?.filter((event) => event.eventType === 'auctionEnd')
      .map((event) => (event as IPrebidAuctionEndEventData).args.bidsReceived)
      .flat() || [];
  const noBids =
    prebid.events
      ?.filter((event) => event.eventType === 'auctionEnd')
      .map((event) => (event as IPrebidAuctionEndEventData).args.noBids)
      .flat() || [];
  return (
    <React.Fragment>
      <Grid
        container
        direction="row"
        justifyContent="start"
        spacing={0.25}
        sx={{
          p: 1,
          '& .MuiGrid-item > .MuiPaper-root': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
      >
        <Grid item xs={12} sx={{ paddingBottom: 0.5 }}>
          <Tabs
            value={value}
            onChange={handleChange}
            sx={{ minHeight: 0, '& > div > div > button': { minHeight: 0 }, '& > div  > span': { display: 'none' } }}
          >
            <Tab
              sx={{ p: 0, justifyContent: 'flex-start' }}
              label={
                <Typography variant="h2" component={Paper} sx={{ p: 1, border: 1, borderColor: value === 0 ? 'primary.main' : 'transparent' }}>
                  Received Bids
                </Typography>
              }
            />
            <Tab
              sx={{ p: 0, justifyContent: 'flex-start' }}
              label={
                <Typography variant="h2" component={Paper} sx={{ p: 1, border: 1, borderColor: value === 1 ? 'primary.main' : 'transparent' }}>
                  No Bids
                </Typography>
              }
            />
          </Tabs>
        </Grid>
        {value === 0 && (
          <React.Fragment>
            <Grid item xs={0.62}>
              <Paper sx={{ height: '100%' }}>
                <IconButton onClick={(event) => setGlobalOpen(!globalOpen)} size="small" sx={{ p: 0.5 }}>
                  <AppsIcon />
                </IconButton>
              </Paper>
            </Grid>
            <Grid item xs={2.38}>
              <Paper sx={{ height: '100%' }}>
                <Typography variant="h3" sx={{ p: 0.5 }}>
                  Bidder Code
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={1}>
              <Paper sx={{ height: '100%' }}>
                <Typography variant="h3" sx={{ p: 0.5 }}>
                  Cpm
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={2}>
              <Paper sx={{ height: '100%' }}>
                <Typography variant="h3" sx={{ p: 0.5 }}>
                  Currency
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper sx={{ height: '100%' }}>
                <Typography variant="h3" sx={{ p: 0.5 }}>
                  AdUnit Code
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={1}>
              <Paper sx={{ height: '100%' }}>
                <Typography variant="h3" sx={{ p: 0.5 }}>
                  Size
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={2}>
              <Paper sx={{ height: '100%' }}>
                <Typography variant="h3" sx={{ p: 0.5 }}>
                  Media Type
                </Typography>
              </Paper>
            </Grid>

            {bidsReceived.map((bid, index) => (
              <BidReceivedRowComponent key={index} bid={bid} globalOpen={globalOpen} />
            ))}
          </React.Fragment>
        )}
        {value === 1 && (
          <React.Fragment>
            <Grid item xs={0.62}>
              <Paper sx={{ height: '100%' }}>
                <IconButton onClick={(event) => setGlobalOpen(!globalOpen)} size="small" sx={{ p: 0.5 }}>
                  <AppsIcon />
                </IconButton>
              </Paper>
            </Grid>
            <Grid item xs={2.38}>
              <Paper sx={{ height: '100%' }}>
                <Typography variant="h3" sx={{ p: 0.5 }}>
                  Bidder Code
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={9}>
              <Paper sx={{ height: '100%' }}>
                <Typography variant="h3" sx={{ p: 0.5 }}>
                  AdUnit Code
                </Typography>
              </Paper>
            </Grid>
            {noBids.map((bid, index) => (
              <NoBidRowComponent key={index} bid={bid} globalOpen={globalOpen} />
            ))}
          </React.Fragment>
        )}
      </Grid>
    </React.Fragment>
  );
};

interface IBidsComponentProps {
  prebid: IPrebidDetails;
}

export default BidsComponent;
