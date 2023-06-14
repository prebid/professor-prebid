import React, { useContext } from 'react';
import Stack from '@mui/material/Stack';
import BidChipComponent from '../../chips/BidChipComponent';
import StateContext from '../../../../contexts/appStateContext';
import { IPrebidAdUnit, IPrebidBidWonEventData } from '../../../../../Content/scripts/prebid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import JSONViewerComponent from '../../../JSONViewerComponent';

const matchesSizes = (bidEvent: IPrebidBidWonEventData, adUnit: IPrebidAdUnit): boolean => {
  const adUnitSizes =
    adUnit.sizes?.map(([width, height]) => `${width}x${height}`) || adUnit.mediaTypes?.banner?.sizes?.map(([width, height]) => `${width}x${height}`);
  const isSizeMatch = adUnitSizes.includes(bidEvent?.args?.size);
  const isNativeMatch = Object.keys(adUnit.mediaTypes).includes('native') && bidEvent.args.mediaType === 'native';
  const isVideoMatch = Object.keys(adUnit.mediaTypes).includes('video') && bidEvent.args.mediaType === 'video';

  return isSizeMatch || isNativeMatch || isVideoMatch;
};

const BiddersTile = ({ adUnit, adUnit: { code: adUnitCode } }: IBiddersTileProps): JSX.Element => {
  const { allWinningBids, allBidResponseEvents, adsRendered, isPanel } = useContext(StateContext);

  if (adUnit?.bids?.length === 0) return null;
  return (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="caption">Bids:</Typography>
      <Stack direction="row" flexWrap={'wrap'} gap={0.5}>
        {adUnit?.bids?.map(({ bidder }, index, arr) => {
          const bidReceived = allBidResponseEvents.find(
            (bidReceived) => bidReceived.args?.adUnitCode === adUnitCode && bidReceived.args.bidder === bidder && matchesSizes(bidReceived, adUnit)
          );

          const isWinner = allWinningBids.some(
            (winningBid) => winningBid.args.adUnitCode === adUnitCode && winningBid.args.bidder === bidder && matchesSizes(winningBid, adUnit)
          );

          const isRendered = adsRendered.some((renderedAd) => renderedAd.args.bid.adUnitCode === adUnitCode && renderedAd.args.bid.bidder === bidder);

          const label = bidReceived?.args.cpm ? `${bidder} (${Number(bidReceived?.args.cpm).toFixed(2)} ${bidReceived?.args.currency})` : `${bidder}`;

          return (
            <BidChipComponent input={arr[index]} label={label} key={index} isWinner={isWinner} bidReceived={bidReceived} isRendered={isRendered} />
          );
        })}
      </Stack>
      {isPanel && (
        <Box sx={{ p: 0.5 }}>
          <Typography variant="caption">Bids JSON:</Typography>
          <JSONViewerComponent style={{ padding: 0 }} src={adUnit.bids} />
        </Box>
      )}
    </Box>
  );
};

export default BiddersTile;
interface IBiddersTileProps {
  adUnit: IPrebidAdUnit;
}
