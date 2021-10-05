import React from 'react';
import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import PrebidDetailsBidderRequestsComponent from './PrebidDetailsBidderRequestsComponent';
import PrebidDetailsBidsComponent from './PrebidDetailsBidsComponent';
import PrebidDetailsSlotsComponent from './PrebidDetailsSlotsComponent';

const PrebidDetailsComponent = ({ prebid }: IPrebidDetailsComponentProps): JSX.Element => {
  const auctionEndEvents = prebid?.events.filter(event => event.eventType === 'auctionEnd') || [];
  return <span>
    <p><strong>Version: </strong>{prebid?.version}</p>
    <p><strong>Timeout: </strong>{prebid?.config?.timeout}</p>
    {auctionEndEvents.map((event, index) =>
      <div key={index}>
        <p><strong>Auction Time: </strong>{event.args.auctionEnd - event.args.timestamp} ms</p>
        <p><strong>Auction Start Time: </strong>{event.args.timestamp}</p>
        <p><strong>Auction End Time: </strong>{event.args.auctionEnd}</p>

      </div>
    )}
    <PrebidDetailsBidderRequestsComponent prebid={prebid}></PrebidDetailsBidderRequestsComponent>
    <PrebidDetailsSlotsComponent prebid={prebid}></PrebidDetailsSlotsComponent>
    <PrebidDetailsBidsComponent prebid={prebid}></PrebidDetailsBidsComponent>
  </span>
};

interface IPrebidDetailsComponentProps {
  prebid: IPrebidDetails;
}

export default PrebidDetailsComponent;
