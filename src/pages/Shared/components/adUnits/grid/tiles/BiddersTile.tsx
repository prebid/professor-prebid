import React, { useContext } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import JSONViewerComponent from '../../../JSONViewerComponent';
import BidChipComponent from '../../chips/BidChipComponent';
import StateContext from '../../../../contexts/appStateContext';
import { IPrebidAdUnit, IPrebidBidWonEventData } from '../../../../../Injected/prebid';
import { useTileExpansion, TileWrapper, TileContent, TileSection } from './Tiles';

const matchesSizes = (bidEvent: IPrebidBidWonEventData, adUnit: IPrebidAdUnit): boolean => {
  const adUnitSizes = adUnit.sizes?.map(([width, height]) => `${width}x${height}`) || adUnit.mediaTypes?.banner?.sizes?.map(([width, height]) => `${width}x${height}`);
  const isSizeMatch = adUnitSizes?.includes(bidEvent?.args?.size);
  const isNativeMatch = Object.keys(adUnit.mediaTypes)?.includes('native') && bidEvent.args.mediaType === 'native';
  const isVideoMatch = Object.keys(adUnit.mediaTypes)?.includes('video') && bidEvent.args.mediaType === 'video';
  return isSizeMatch || isNativeMatch || isVideoMatch;
};

const BiddersTile = ({ adUnit, adUnit: { code: adUnitCode }, colCount }: { adUnit: IPrebidAdUnit; colCount: number }): JSX.Element => {
  const { allWinningBids, allBidResponseEvents, allBidRequestedEvents, adsRendered, isPanel } = useContext(StateContext);
  const { expanded, toggle } = useTileExpansion();

  return (
    <TileWrapper expanded={expanded} onToggle={toggle} isPanel={isPanel} colCount={colCount}>
      <TileContent
        expanded={expanded}
        collapsedView={
          <TileSection label="Bids">
            {adUnit?.bids?.map(({ bidder }, index, arr) => {
              const bidReceived = allBidResponseEvents.find((bidReceived) => bidReceived.args?.adUnitCode === adUnitCode && bidReceived.args.bidder === bidder && matchesSizes(bidReceived, adUnit));
              const bidRequested = allBidRequestedEvents.find((bidReq) => bidReq.args.bidderCode === bidder && bidReq.args.bids.find((bid) => bid.adUnitCode === adUnitCode));
              const isWinner = allWinningBids.some((winningBid) => winningBid.args.adUnitCode === adUnitCode && winningBid.args.bidder === bidder && matchesSizes(winningBid, adUnit));
              const isRendered = adsRendered.some((renderedAd) => renderedAd.args.bid.adUnitCode === adUnitCode && renderedAd.args.bid.bidder === bidder);
              const label = bidReceived?.args.cpm ? `${bidder} (${Number(bidReceived?.args.cpm).toFixed(2)} ${bidReceived?.args.currency})` : bidder;

              return <BidChipComponent input={arr[index]} label={label} key={index} isWinner={isWinner} bidRequested={bidRequested} bidReceived={bidReceived} isRendered={isRendered} />;
            })}
          </TileSection>
        }
        expandedView={
          <Box sx={{ p: 0.5 }}>
            <Typography variant="caption">Bids JSON:</Typography>
            <JSONViewerComponent style={{ padding: 0 }} src={adUnit.bids} collapsed={2} />
          </Box>
        }
      />
    </TileWrapper>
  );
};

export default BiddersTile;
