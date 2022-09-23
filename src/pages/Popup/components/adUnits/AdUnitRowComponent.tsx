import React, { useEffect } from 'react';
import { IPrebidAdUnit, IPrebidBidWonEventData, IPrebidAdRenderSucceededEventData, IPrebidDetails } from '../../../../inject/scripts/prebid';
import Stack from '@mui/material/Stack';
import BidChipComponent from './BidChipComponent';
import AdUnitChipComponent from './AdUnitChipComponent';
import MediaTypesComponent from './MediaTypesComponent';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material';

const AdUnitRowComponent = ({ adUnit, events }: { adUnit: IPrebidAdUnit; events: IPrebidDetails['events'] }): JSX.Element => {
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
                  (adUnit.sizes?.map((size) => `${size[0]}x${size[1]}`).includes(bidReceived?.args?.size) ||
                    (Object.keys(adUnit.mediaTypes).includes('native') && bidReceived.args.mediaType === 'native') ||
                    (Object.keys(adUnit.mediaTypes).includes('video') && bidReceived.args.mediaType === 'video'))
              );

              const isWinner = winningBids.some(
                (winningBid) =>
                  winningBid.args.adUnitCode === adUnit.code &&
                  winningBid.args.bidder === bid.bidder &&
                  (adUnit.sizes?.map((size) => `${size[0]}x${size[1]}`).includes(winningBid?.args?.size) ||
                    (Object.keys(adUnit.mediaTypes).includes('native') && winningBid.args.mediaType === 'native') ||
                    (Object.keys(adUnit.mediaTypes).includes('video') && winningBid.args.mediaType === 'video'))
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

export default AdUnitRowComponent;
