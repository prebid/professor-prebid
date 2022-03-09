import React, { useEffect } from 'react';
import {
  IPrebidAuctionEndEventData,
  IPrebidAdUnit,
  IPrebidBidWonEventData,
  IPrebidAdRenderSucceededEventData,
  IPrebidDetails,
} from '../../../../inject/scripts/prebid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import theme from '../../../theme';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import BidderStackComponent from './BidderStackComponent';
import BidChipComponent from './BidChipComponent';
import AdUnitChipComponent from './AdUnitChipComponent';
import MediaTypesComponent from './MediaTypesComponent';
import Grid from '@mui/material/Grid';

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
    <TableRow sx={{ verticalAlign: 'top', '&:last-child td, &:last-child th': { border: 0 } }}>
      <TableCell variant="body">
        <AdUnitChipComponent adUnit={adUnit} />
      </TableCell>
      <TableCell variant="body">
        <MediaTypesComponent mediaTypes={adUnit.mediaTypes} />
      </TableCell>
      <TableCell variant="body">
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: '5px' }}>
          {adUnit.bids.map((bid, index) => {
            const bidReceived = latestAuctionsBidsReceived.find(
              (bidReceived) =>
                bidReceived.args?.adUnitCode === adUnit.code &&
                bidReceived.args.bidder === bid.bidder &&
                adUnit.sizes?.map((size) => `${size[0]}x${size[1]}`).includes(bidReceived?.args?.size)
            );
            const isWinner = latestAuctionsWinningBids.some(
              (winningBid) =>
                winningBid.args.adUnitCode === adUnit.code &&
                winningBid.args.bidder === bid.bidder &&
                adUnit.sizes?.map((size) => `${size[0]}x${size[1]}`).includes(bidReceived?.args.size)
            );
            const isRendered = latestAuctionsAdsRendered.some(
              (renderedAd) =>
                renderedAd.args.bid.adUnitCode === adUnit.code &&
                renderedAd.args.bid.bidder === bid.bidder &&
                renderedAd.args.bid.auctionId === bid.auctionId
            );
            const label = bidReceived?.args.cpm
              ? `${bid.bidder} (${bidReceived?.args.cpm.toFixed(2)} ${bidReceived?.args.currency})`
              : `${bid.bidder}`;
            return <BidChipComponent input={bid} label={label} key={index} isWinner={isWinner} bidReceived={bidReceived} isRendered={isRendered} />;
          })}
        </Stack>
      </TableCell>
    </TableRow>
  );
};

const SlotsComponent = ({ adUnits, events }: ISlotsComponentProps): JSX.Element => {
  return (
    <Grid item xs={12}>
      <TableContainer
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 1,
          [theme.breakpoints.down('sm')]: {
            display: 'none',
          },
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell variant="head" sx={{ width: 0.33 }}>
                <Typography variant="h3">Code</Typography>
              </TableCell>
              <TableCell variant="head" sx={{ width: 0.33 }}>
                <Typography variant="h3">Media Types</Typography>
              </TableCell>
              <TableCell variant="head" sx={{ width: 0.33 }}>
                <Typography variant="h3">Bidders</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {adUnits.map((adUnit, index) => (
              <Row events={events} adUnit={adUnit} key={index} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
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
  );
};

interface ISlotsComponentProps {
  events: IPrebidDetails['events'];
  adUnits: IPrebidAdUnit[];
}

export default SlotsComponent;
