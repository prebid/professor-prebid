import React, { useEffect, useContext } from 'react';
import {
  IPrebidAuctionEndEventData,
  IPrebidAdUnit,
  IPrebidBidWonEventData,
  IPrebidAdRenderSucceededEventData,
} from '../../../../Content/scripts/prebid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import CardContent from '@mui/material/CardContent';
import BidChipComponent from '../chips/BidChipComponent';
import StateContext from '../../../contexts/appStateContext';
import InspectedPageContext from '../../../contexts/inspectedPageContext';
import Chip from '@mui/material/Chip';
import MediaTypeChipComponent from '../chips/MediaTypeChipComponent';

const AdUnitCard = ({ adUnit, adUnit: { code: adUnitCode } }: { adUnit: IPrebidAdUnit }): JSX.Element => {
  const { pbjsNamespace } = useContext(StateContext);
  const { prebids } = useContext(InspectedPageContext);
  const { events } = prebids?.[pbjsNamespace];
  const { mediaTypes } = adUnit;
  const [winningBids, setAuctionsWinningBids] = React.useState<IPrebidBidWonEventData[]>([]);
  const [auctionsBidsReceived, setAuctionBidsReceived] = React.useState<IPrebidBidWonEventData[]>([]);
  const [auctionsAdsRendered, setAuctionsAdsRendered] = React.useState<IPrebidAdRenderSucceededEventData[]>([]);

  useEffect(() => {
    const auctionEndEvents = (events as IPrebidAuctionEndEventData[])
      .filter((event) => event.eventType === 'auctionInit' || event.eventType === 'auctionEnd')
      .sort((a, b) => a.args.timestamp - b.args.timestamp);

    const { auctionId: latestAuctionId } = auctionEndEvents[0]?.args;

    const auctionsWinningBids = (events as IPrebidBidWonEventData[]).filter(
      ({ eventType, args: { auctionId } }) => eventType === 'bidWon' && auctionId === latestAuctionId
    );

    const auctionsBidsReceived = (events as IPrebidBidWonEventData[]).filter(
      ({ eventType, args: { auctionId } }) => eventType === 'bidResponse' && auctionId === latestAuctionId
    );

    const auctionsAdsRendered = (events as IPrebidAdRenderSucceededEventData[]).filter(
      ({
        eventType,
        args: {
          bid: { auctionId },
        },
      }) => eventType === 'adRenderSucceeded' && auctionId === latestAuctionId
    );

    setAuctionsWinningBids(auctionsWinningBids);
    setAuctionBidsReceived(auctionsBidsReceived);
    setAuctionsAdsRendered(auctionsAdsRendered);
  }, [events]);

  return (
    <Card sx={{ m: 1 }} variant="outlined">
      <CardContent>
        <Typography variant="h3" sx={{ pt: 1 }}>
          Code: {adUnit.code}
        </Typography>

        <Typography variant="h3" sx={{ pt: 1 }}>
          Media Types:
        </Typography>

        {Object.keys(mediaTypes).map((mediaType, index) => (
          <React.Fragment key={index}>
            {mediaType === 'banner' && mediaTypes['banner'].sizes && (
              <React.Fragment>
                <Typography variant="caption">Banner Sizes:</Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {mediaTypes['banner'].sizes?.map((size, index) => (
                    <MediaTypeChipComponent
                      input={mediaTypes['banner']}
                      label={`${size[0]}x${size[1]}`}
                      key={index}
                      isWinner={winningBids.find(({ args }) => args.adUnitCode === adUnitCode)?.args?.size === `${size[0]}x${size[1]}`}
                    />
                  ))}
                </Stack>
              </React.Fragment>
            )}
            {mediaType === 'banner' &&
              mediaTypes['banner'].sizeConfig?.map(({ minViewPort, sizes }, index) => (
                <React.Fragment key={index}>
                  <Typography variant="caption">
                    minViewPort {minViewPort[0]}x{minViewPort[1]}:
                  </Typography>
                  <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {sizes.map((size, index) => (
                      <Chip size="small" variant="outlined" color="primary" label={`${size[0]}x${size[1]}`} key={index} />
                    ))}
                  </Stack>
                </React.Fragment>
              ))}
            {mediaType === 'video' && (
              <React.Fragment key={index}>
                <Typography variant="caption">Video:</Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {Object.keys(mediaTypes['video']).map((key, index) => (
                    <MediaTypeChipComponent
                      input={mediaTypes['video']}
                      label={`${key}: ${JSON.stringify(mediaTypes['video'][key as keyof typeof mediaTypes['video']])}`}
                      key={index}
                    />
                  ))}
                </Stack>
              </React.Fragment>
            )}
            {mediaType === 'native' && (
              <React.Fragment key={index}>
                <Typography variant="caption">Native:</Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {Object.keys(mediaTypes['native']).map((key, index) => (
                    <MediaTypeChipComponent
                      input={mediaTypes['native']}
                      label={`${key}: ${JSON.stringify(mediaTypes['native'][key as keyof typeof mediaTypes['native']])}`}
                      key={index}
                    />
                  ))}
                </Stack>
              </React.Fragment>
            )}
          </React.Fragment>
        ))}

        <Typography variant="h3" sx={{ pt: 1 }}>
          Bidders:
        </Typography>

        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
          {adUnit.bids.map(({ bidder, auctionId }, index, arr) => {
            const bidReceived = auctionsBidsReceived.find(
              (bidReceived) =>
                bidReceived.args?.adUnitCode === adUnit.code &&
                bidReceived.args.bidder === bidder &&
                adUnit.sizes?.map((size) => `${size[0]}x${size[1]}`)?.includes(bidReceived?.args?.size)
            );
            const isWinner = winningBids.some(
              (winningBid) =>
                winningBid.args.adUnitCode === adUnit.code &&
                winningBid.args.bidder === bidder &&
                adUnit.sizes?.map((size) => `${size[0]}x${size[1]}`)?.includes(bidReceived?.args.size)
            );
            const isRendered = auctionsAdsRendered.some(
              (renderedAd) =>
                renderedAd.args.bid.adUnitCode === adUnit.code && renderedAd.args.bid.bidder === bidder && renderedAd?.args?.bid?.auctionId === auctionId
            );
            const label = bidReceived?.args.cpm
              ? `${bidder} (${Number(bidReceived?.args.cpm).toFixed(2)} ${bidReceived?.args.currency})`
              : `${bidder}`;
            return (
              <BidChipComponent input={arr[index]} label={label} key={index} isWinner={isWinner} bidReceived={bidReceived} isRendered={isRendered} />
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default AdUnitCard;
