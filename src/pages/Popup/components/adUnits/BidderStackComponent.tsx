import React from 'react';
import { IPrebidAdUnit, IPrebidBidWonEventData, IPrebidAdRenderSucceededEventData } from '../../../Content/scripts/prebid';
import Stack from '@mui/material/Stack';
import BidChipComponent from './BidChipComponent';

const BidderStack = ({
  adUnit,
  latestAuctionsBidsReceived,
  latestAuctionsWinningBids,
  latestAuctionsAdsRendered,
}: IBidderStackComponentProps): JSX.Element => {
  return (
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
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
          ? `${bid.bidder} (${Number(bidReceived?.args.cpm).toFixed(2)} ${bidReceived?.args.currency})`
          : `${bid.bidder}`;
        return <BidChipComponent input={bid} label={label} key={index} isWinner={isWinner} bidReceived={bidReceived} isRendered={isRendered} />;
      })}
    </Stack>
  );
};

export default BidderStack;
interface IBidderStackComponentProps {
  adUnit: IPrebidAdUnit;
  latestAuctionsBidsReceived: IPrebidBidWonEventData[];
  latestAuctionsWinningBids: IPrebidBidWonEventData[];
  latestAuctionsAdsRendered: IPrebidAdRenderSucceededEventData[];
}
