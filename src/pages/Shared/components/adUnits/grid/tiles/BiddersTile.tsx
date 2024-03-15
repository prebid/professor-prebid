import React, { useContext } from 'react';
import Stack from '@mui/material/Stack';
import BidChipComponent from '../../chips/BidChipComponent';
import StateContext from '../../../../contexts/appStateContext';
import { IPrebidAdUnit, IPrebidBidWonEventData } from '../../../../../Content/scripts/prebid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import JSONViewerComponent from '../../../JSONViewerComponent';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const matchesSizes = (bidEvent: IPrebidBidWonEventData, adUnit: IPrebidAdUnit): boolean => {
  const adUnitSizes =
    adUnit.sizes?.map(([width, height]) => `${width}x${height}`) || adUnit.mediaTypes?.banner?.sizes?.map(([width, height]) => `${width}x${height}`);
  const isSizeMatch = adUnitSizes?.includes(bidEvent?.args?.size);
  const isNativeMatch = Object.keys(adUnit.mediaTypes)?.includes('native') && bidEvent.args.mediaType === 'native';
  const isVideoMatch = Object.keys(adUnit.mediaTypes)?.includes('video') && bidEvent.args.mediaType === 'video';

  return isSizeMatch || isNativeMatch || isVideoMatch;
};

const BiddersTile = ({ adUnit, adUnit: { code: adUnitCode } }: IBiddersTileProps): JSX.Element => {
  const { allWinningBids, allBidResponseEvents, adsRendered, isPanel } = useContext(StateContext);
  const [expanded, setExpanded] = React.useState(false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };
  // if (adUnit?.bids?.length === 0) return null;
  return (
    <Grid
      item
      xs={4}
      md={4}
      sx={{
        overflow: 'hidden',
        position: 'relative', // Ensure relative positioning for the overlay
        '&:after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '6px', // Adjust the height of the overlay as needed
          background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1))',
          pointerEvents: 'none', // Allow interactions with underlying elements
        },
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <Paper sx={{ height: '100%', position: 'relative' }}>
        <Box
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
          sx={{
            zIndex: 100,
            position: 'absolute',
            right: '0px',
            top: '0px',
            display: isPanel ? 'block' : 'none',
          }}
        >
          {!expanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        </Box>
        <Box onClick={(e) => e.stopPropagation()}>
          <Box sx={{ p: 0.5 }}>
            {!expanded && (
              <>
                <Typography variant="caption">Bids:</Typography>
                <Stack direction="row" flexWrap={'wrap'} gap={0.5}>
                  {adUnit?.bids?.map(({ bidder }, index, arr) => {
                    const bidReceived = allBidResponseEvents.find(
                      (bidReceived) =>
                        bidReceived.args?.adUnitCode === adUnitCode && bidReceived.args.bidder === bidder && matchesSizes(bidReceived, adUnit)
                    );

                    const isWinner = allWinningBids.some(
                      (winningBid) =>
                        winningBid.args.adUnitCode === adUnitCode && winningBid.args.bidder === bidder && matchesSizes(winningBid, adUnit)
                    );

                    const isRendered = adsRendered.some(
                      (renderedAd) => renderedAd.args.bid.adUnitCode === adUnitCode && renderedAd.args.bid.bidder === bidder
                    );

                    const label = bidReceived?.args.cpm
                      ? `${bidder} (${Number(bidReceived?.args.cpm).toFixed(2)} ${bidReceived?.args.currency})`
                      : `${bidder}`;

                    return (
                      <BidChipComponent
                        input={arr[index]}
                        label={label}
                        key={index}
                        isWinner={isWinner}
                        bidReceived={bidReceived}
                        isRendered={isRendered}
                      />
                    );
                  })}
                </Stack>
              </>
            )}
            {expanded && (
              <Box sx={{ p: 0.5 }}>
                <Typography variant="caption">Bids JSON:</Typography>
                <JSONViewerComponent style={{ padding: 0 }} src={adUnit.bids} />
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Grid>
  );
};

export default BiddersTile;
interface IBiddersTileProps {
  adUnit: IPrebidAdUnit;
}
