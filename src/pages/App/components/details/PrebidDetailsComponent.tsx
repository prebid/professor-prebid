import React from 'react';
import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import PrebidDetailsBidsComponent from './PrebidDetailsBidsComponent';
import PrebidDetailsSlotsComponent from './PrebidDetailsSlotsComponent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const PrebidDetailsComponent = ({ prebid }: IPrebidDetailsComponentProps): JSX.Element => {
  const auctionEndEvents = prebid.events.filter(event => event.eventType === 'auctionEnd') || [];
  const allAvailableBids = prebid.events.filter(event => event.eventType === 'bidResponse') || [];
  const allNoBids = prebid.events.filter(event => event.eventType === 'noBid') || [];
  const allAdUnits = Array.from(new Set(prebid?.events?.filter(event => event.eventType === 'auctionInit').reduce((previousValue, currentValue) => [].concat(previousValue, currentValue.args.adUnitCodes), [])))
  const allBidders = Array.from(new Set([].concat(allAvailableBids, allNoBids).map(event => event?.args.bidder)))

  return (
    <Box>
      {prebid.version && <Typography><strong>Version: </strong>{prebid.version}</Typography>}
      {prebid.config?.timeout && <Typography><strong>Timeout: </strong>{prebid.config.timeout}</Typography>}
      {auctionEndEvents.map((event, index) =>
        <Box key={index}>
          <Typography><strong>Auction Time: </strong>{event.args.auctionEnd - event.args.timestamp} ms</Typography>
          <Typography><strong>Auction Start Time: </strong>{new Date(event.args.timestamp).toISOString()}</Typography>
          <Typography><strong>Auction End Time: </strong>{new Date(event.args.auctionEnd).toISOString()}</Typography>
          <Typography><strong>AdUnits Detected: </strong> {allAdUnits.length}</Typography>
          <Typography><strong>Bidders: </strong>{allBidders.length}</Typography>
          <Typography><strong>NoBid / Bid Ratio: </strong>{allNoBids.length} / {allAvailableBids.length}</Typography>
        </Box>
      )}
      {prebid.events[0] && <PrebidDetailsSlotsComponent prebid={prebid}></PrebidDetailsSlotsComponent>}
      {prebid.events[0] && <PrebidDetailsBidsComponent prebid={prebid}></PrebidDetailsBidsComponent>}
    </Box>
  )
};

interface IPrebidDetailsComponentProps {
  prebid: IPrebidDetails;
}

export default PrebidDetailsComponent;
