import React, { useEffect } from 'react';
import {
  IPrebidAuctionEndEventData,
  IPrebidAdUnit,
  IPrebidBidWonEventData,
  IPrebidAdRenderSucceededEventData,
  IPrebidDetails,
} from '../../../../inject/scripts/prebid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import BidderStackComponent from './BidderStackComponent';
import BidChipComponent from './BidChipComponent';
import AdUnitChipComponent from './AdUnitChipComponent';
import MediaTypesComponent from './MediaTypesComponent';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material';

const AdUnitCard = ({ adUnit, events }: { adUnit: IPrebidAdUnit; events: IPrebidDetails['events'] }): JSX.Element => {
  const [latestAuctionsWinningBids, setLatestAuctionsWinningBids] = React.useState<IPrebidBidWonEventData[]>([]);
  const [latestAuctionsBidsReceived, setLatestAuctionBidsReceived] = React.useState<IPrebidBidWonEventData[]>([]);
  const [latestAuctionsAdsRendered, setLatestAuctionsAdsRendered] = React.useState<IPrebidAdRenderSucceededEventData[]>([]);

  useEffect(() => {
    const auctionEndEvents = ((events || []) as IPrebidAuctionEndEventData[])
      .filter((event) => event.eventType === 'auctionInit' || event.eventType === 'auctionEnd')
      .sort((a, b) => a.args.timestamp - b.args.timestamp);
    const latestAuctionId = auctionEndEvents[0]?.args.auctionId;
    const latestAuctionsWinningBids = ((events || []) as IPrebidBidWonEventData[]).filter(
      (event) => event.eventType === 'bidWon' && event.args.auctionId === latestAuctionId
    );
    const latestAuctionsBidsReceived = ((events || []) as IPrebidBidWonEventData[]).filter(
      (event) => event.eventType === 'bidResponse' && event.args.auctionId === latestAuctionId
    );
    const latestAuctionsAdsRendered = ((events || []) as IPrebidAdRenderSucceededEventData[]).filter(
      (event) => event.eventType === 'adRenderSucceeded' && event.args.bid.auctionId === latestAuctionId
    );
    setLatestAuctionsWinningBids(latestAuctionsWinningBids);
    setLatestAuctionBidsReceived(latestAuctionsBidsReceived);
    setLatestAuctionsAdsRendered(latestAuctionsAdsRendered);
  }, [events]);
  return (
    <Card sx={{ m: 1 }} variant="outlined">
      <CardContent>
        <Typography variant="h3" sx={{ pt: 1 }}>
          Code:
          <Typography variant="body2" component="span">
            {adUnit.code}
          </Typography>
        </Typography>
        <Typography variant="h3" sx={{ pt: 1 }}>
          Media Types:
        </Typography>
        <MediaTypesComponent mediaTypes={adUnit.mediaTypes} />
        <Typography variant="h3" sx={{ pt: 1 }}>
          Bidders:
        </Typography>
        <BidderStackComponent
          adUnit={adUnit}
          latestAuctionsBidsReceived={latestAuctionsBidsReceived}
          latestAuctionsWinningBids={latestAuctionsWinningBids}
          latestAuctionsAdsRendered={latestAuctionsAdsRendered}
        ></BidderStackComponent>
      </CardContent>
    </Card>
  );
};

const Row = ({ adUnit, events }: { adUnit: IPrebidAdUnit; events: IPrebidDetails['events'] }): JSX.Element => {
  const [winningBids, setWinningBids] = React.useState<IPrebidBidWonEventData[]>([]);
  const [bidsReceived, setBidsReceived] = React.useState<IPrebidBidWonEventData[]>([]);
  const [adsRendered, setAdsRendered] = React.useState<IPrebidAdRenderSucceededEventData[]>([]);
  const theme = useTheme();
  useEffect(() => {
    setWinningBids(((events || []) as IPrebidBidWonEventData[]).filter((event) => event.eventType === 'bidWon'));
    setBidsReceived(((events || []) as IPrebidBidWonEventData[]).filter((event) => event.eventType === 'bidResponse'));
    setAdsRendered(((events || []) as IPrebidAdRenderSucceededEventData[]).filter((event) => event.eventType === 'adRenderSucceeded'));
  }, [events]);
  return (
    <React.Fragment>
      <Grid item xs={4} sx={{ [theme.breakpoints.down('sm')]: { display: 'none' } }}>
        <Paper sx={{ height: '100%' }}>
          <AdUnitChipComponent adUnit={adUnit} />
        </Paper>
      </Grid>
      <Grid item xs={4} sx={{ [theme.breakpoints.down('sm')]: { display: 'none' } }}>
        <Paper sx={{ height: '100%' }}>
          <MediaTypesComponent
            mediaTypes={adUnit.mediaTypes}
            winningBid={winningBids.find((winningBid) => winningBid.args.adUnitCode === adUnit.code)}
          />
        </Paper>
      </Grid>
      <Grid item xs={4} sx={{ [theme.breakpoints.down('sm')]: { display: 'none' } }}>
        <Paper sx={{ height: '100%' }}>
          <Stack direction="row" flexWrap={'wrap'} gap={0.5} sx={{ p: 0.5 }}>
            {adUnit.bids.map((bid, index) => {
              const bidReceived = bidsReceived.find(
                (bidReceived) =>
                  bidReceived.args?.adUnitCode === adUnit.code &&
                  bidReceived.args.bidder === bid.bidder &&
                  adUnit.sizes?.map((size) => `${size[0]}x${size[1]}`).includes(bidReceived?.args?.size)
              );
              const isWinner = winningBids.some(
                (winningBid) =>
                  winningBid.args.adUnitCode === adUnit.code &&
                  winningBid.args.bidder === bid.bidder &&
                  adUnit.sizes?.map((size) => `${size[0]}x${size[1]}`).includes(bidReceived?.args.size)
              );
              const isRendered = adsRendered.some(
                (renderedAd) => renderedAd.args.bid.adUnitCode === adUnit.code && renderedAd.args.bid.bidder === bid.bidder
              );
              const label = bidReceived?.args.cpm
                ? `${bid.bidder} (${bidReceived?.args.cpm.toFixed(2)} ${bidReceived?.args.currency})`
                : `${bid.bidder}`;
              return <BidChipComponent input={bid} label={label} key={index} isWinner={isWinner} bidReceived={bidReceived} isRendered={isRendered} />;
            })}
          </Stack>
        </Paper>
      </Grid>
    </React.Fragment>
  );
};

const SlotsComponent = ({ adUnits, events }: ISlotsComponentProps): JSX.Element => {
  const theme = useTheme();
  return (
    <React.Fragment>
      <Grid item xs={4}>
        <Paper>
          <Typography variant="h3" sx={{ p: 0.5, [theme.breakpoints.down('sm')]: { display: 'none' } }}>
            Code
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={4}>
        <Paper>
          <Typography variant="h3" sx={{ p: 0.5, [theme.breakpoints.down('sm')]: { display: 'none' } }}>
            Media Types
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={4}>
        <Paper>
          <Typography variant="h3" sx={{ p: 0.5, [theme.breakpoints.down('sm')]: { display: 'none' } }}>
            Bidders
          </Typography>
        </Paper>
      </Grid>
      {adUnits.map((adUnit, index) => (
        <Row events={events} adUnit={adUnit} key={index} />
      ))}
      <Grid item xs={12}>
        <Stack
          sx={{
            backgroundColor: 'primary.light',
            [theme.breakpoints.up('sm')]: {
              display: 'none',
            },
          }}
        >
          {adUnits.map((adUnit, index) => (
            <AdUnitCard events={events} adUnit={adUnit} key={index} />
          ))}
        </Stack>
      </Grid>
    </React.Fragment>
  );
};

interface ISlotsComponentProps {
  events: IPrebidDetails['events'];
  adUnits: IPrebidAdUnit[];
}

export default SlotsComponent;
