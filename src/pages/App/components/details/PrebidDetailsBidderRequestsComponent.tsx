import { IPrebidDetails } from "../../../../inject/scripts/prebid";
import React from 'react';
const PrebidDetailsBidderRequestsComponent = ({ prebid }: IPrebidDetailsComponentProps): JSX.Element => {
  const auctionEndEvents = prebid.events.filter(event => event.eventType === 'auctionEnd');
  return <span>
    <p><strong>Prebid Slots</strong></p>
    {auctionEndEvents.map((event, index) =>
      <div key={index}>
        <table>
          <thead>
            <tr>
              <th>Bidder</th>
              <th>Request Timestamp</th>
              <th>Response Timestamp</th>
              <th>Response Time</th>
            </tr>
          </thead>
          <tbody>
            {
              event.args.bidderRequests.map((bidderRequest, index) => {
                const maxBidReceivedResponseTimestamp = event.args.bidsReceived
                  .filter(bid => bid.bidderCode === bidderRequest.bidderCode)
                  .map(bid => bid.responseTimestamp)
                  .reduce((previous, value) => previous > value ? previous : value, 0);

                const maxTimeToRespondTimestamp = event.args.bidsReceived
                  .filter(bid => bid.bidderCode === bidderRequest.bidderCode)
                  .map(bid => bid.timeToRespond)
                  .reduce((previous, value) => previous > value ? previous : value, 0);

                return <tr key={index}>
                  <td>{bidderRequest.bidderCode}</td>
                  <td>{bidderRequest.start}</td>
                  <td>{maxBidReceivedResponseTimestamp}</td>
                  <td>{maxTimeToRespondTimestamp}ms</td>
                </tr>
              })}
          </tbody>
        </table>
      </div>
    )}
  </span>
};
interface IPrebidDetailsComponentProps {
  prebid: IPrebidDetails;
}

export default PrebidDetailsBidderRequestsComponent;