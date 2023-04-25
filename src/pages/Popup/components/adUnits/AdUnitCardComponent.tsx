import React, { useEffect } from 'react';
import {
  IPrebidAuctionEndEventData,
  IPrebidAdUnit,
  IPrebidBidWonEventData,
  IPrebidAdRenderSucceededEventData,
  IPrebidDetails,
} from '../../../Content/scripts/prebid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import BidderStackComponent from './BidderStackComponent';
import MediaTypesComponent from './MediaTypesComponent';

const AdUnitCardComponent = ({ adUnit, events }: { adUnit: IPrebidAdUnit; events: IPrebidDetails['events'] }): JSX.Element => {
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

export default AdUnitCardComponent;
