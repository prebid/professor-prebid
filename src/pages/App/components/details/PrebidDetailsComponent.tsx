import React from 'react';
import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import PrebidDetailsBidderRequestsComponent from './PrebidDetailsBidderRequestsComponent';
import PrebidDetailsBidsComponent from './PrebidDetailsBidsComponent';
import PrebidDetailsSlotsComponent from './PrebidDetailsSlotsComponent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const PrebidDetailsComponent = ({ prebid }: IPrebidDetailsComponentProps): JSX.Element => {
  const auctionEndEvents = prebid?.events.filter(event => event.eventType === 'auctionEnd') || [];
  return (
    <Box>
      <Typography><strong>Version: </strong>{prebid?.version}</Typography>
      <Typography><strong>Timeout: </strong>{prebid?.config?.timeout}</Typography>
      {auctionEndEvents.map((event, index) =>
        <Box key={index}>
          <Typography><strong>Auction Time: </strong>{event.args.auctionEnd - event.args.timestamp} ms</Typography>
          <Typography><strong>Auction Start Time: </strong>{event.args.timestamp}</Typography>
          <Typography><strong>Auction End Time: </strong>{event.args.auctionEnd}</Typography>
        </Box>
      )}
      <PrebidDetailsBidderRequestsComponent prebid={prebid}></PrebidDetailsBidderRequestsComponent>
      <PrebidDetailsSlotsComponent prebid={prebid}></PrebidDetailsSlotsComponent>
      <PrebidDetailsBidsComponent prebid={prebid}></PrebidDetailsBidsComponent>
    </Box>
  )
};

interface IPrebidDetailsComponentProps {
  prebid: IPrebidDetails;
}

export default PrebidDetailsComponent;
