import React from 'react';
import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import PrebidDetailsBidsComponent from './PrebidDetailsBidsComponent';
import PrebidDetailsSlotsComponent from './PrebidDetailsSlotsComponent';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const PrebidDetailsComponent = ({ prebid }: IPrebidDetailsComponentProps): JSX.Element => {
  const auctionEndEvents = prebid.events.filter(event => event.eventType === 'auctionEnd') || [];
  const allAvailableBids = prebid.events.filter(event => event.eventType === 'bidResponse') || [];
  const allNoBids = prebid.events.filter(event => event.eventType === 'noBid') || [];
  const allAdUnits = Array.from(new Set(prebid?.events?.filter(event => event.eventType === 'auctionInit').reduce((previousValue, currentValue) => [].concat(previousValue, currentValue.args.adUnitCodes), [])))
  const allBidders = Array.from(new Set([].concat(allAvailableBids, allNoBids).map(event => event?.args.bidder)))

  return (
    <Card sx={{ backgroundColor: '#eceeef' }}>
      <CardContent>
        <Typography>
          {prebid.version && <Typography><strong>Version: </strong>{prebid.version}</Typography>}
          {prebid.config?.timeout && <Typography><strong>Timeout: </strong>{prebid.config.timeout}</Typography>}
        </Typography>
        {auctionEndEvents.map((event, index) =>
          <React.Fragment key={index} >
            <Typography sx={{ fontSize: 14 }}>
              <Typography><strong>Auction Start Time: </strong>{new Date(event.args.timestamp).toISOString()}</Typography>
              <Typography><strong>Auction End Time: </strong>{new Date(event.args.auctionEnd).toISOString()}</Typography>
              <Typography><strong>Auction Time: </strong>{event.args.auctionEnd - event.args.timestamp} ms</Typography>
            </Typography>
            <Typography variant="h5" component="div">
            </Typography>
            <Typography sx={{ mb: 1.5 }} color="text.secondary">
            </Typography>
            <Typography variant="body1">
              <Typography><strong>AdUnits Detected: </strong> {allAdUnits.length}</Typography>
              <Typography><strong>Bidders: </strong>{allBidders.length}</Typography>
              <Typography><strong>NoBid / Bid Ratio: </strong>{allNoBids.length} / {allAvailableBids.length}</Typography>
            </Typography>
          </React.Fragment>
        )}
        <Typography variant="body1">
          {prebid.events[0] && <PrebidDetailsSlotsComponent prebid={prebid}></PrebidDetailsSlotsComponent>}
          {prebid.events[0] && <PrebidDetailsBidsComponent prebid={prebid}></PrebidDetailsBidsComponent>}
        </Typography>
      </CardContent>
    </Card>
  )
};

interface IPrebidDetailsComponentProps {
  prebid: IPrebidDetails;
}

export default PrebidDetailsComponent;
