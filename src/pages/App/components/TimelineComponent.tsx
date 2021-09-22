import { IPrebidDetails } from "../../../inject/scripts/prebid";
import React from 'react';

const TimelineComponent: React.FC<ITimelineComponentProps> = ({ prebid }) => {
  const dataRows = Object.keys(prebid.events.bidders)
    .map(key => {
      const bidder = prebid.events.bidders[key];
      const auctionStartTimestamp = prebid.events.auctionStartTimestamp - 100;
      const auctionEndTimestamp = prebid.events.auctionEndTimestamp + 100;
      const auctionLength = auctionEndTimestamp - auctionStartTimestamp;
      return {
        bidder: key,
        offset: bidder.responseTimestamp - bidder.requestTimestamp,
        requestTimestamp: bidder.requestTimestamp,
        responseTimestamp: bidder.responseTimestamp,
        marginLeft: `${(bidder.requestTimestamp - auctionStartTimestamp) / auctionLength * 100}%`,
        marginRight: `${(auctionEndTimestamp - bidder.responseTimestamp) / auctionLength * 100}%`
      }
    })
    .sort((a, b) => a.requestTimestamp - b.requestTimestamp);

  return (
    <table style={{ width: '100%' }}>
      <tbody>
        <tr className="subheader">
          <td>
            {dataRows.map((row, index) =>
              <div className="request" style={{
                border: '1px dotted black',
                marginLeft: row.marginLeft,
                marginRight: row.marginRight,
              }} key={index}>
                {row.bidder}: {row.offset}ms
              </div>
            )}
          </td>
        </tr>
      </tbody>
    </table >
  );
};

interface ITimelineComponentProps {
  prebid: IPrebidDetails;
}

export default TimelineComponent;