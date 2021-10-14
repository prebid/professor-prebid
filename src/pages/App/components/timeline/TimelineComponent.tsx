import { IPrebidDetails } from "../../../../inject/scripts/prebid";
import { IGoogleAdManagerDetails } from "../../../../inject/scripts/googleAdManager";
import React from 'react';


const TimeLine = ({ prebid }: ITimelineComponentProps): JSX.Element => {
  let timelinePadding = 50;
  const updateTimelineTimestamps = (timestampArray: number[]) => {
    let timelineStartTimestamp: number = null;
    let timelineEndTimestamp: number = null;
    timestampArray.forEach(timestamp => {
      if (timestamp < timelineStartTimestamp || timelineStartTimestamp === null) {
        timelineStartTimestamp = timestamp;
      }
      if (timestamp > timelineEndTimestamp || timelineEndTimestamp === null) {
        timelineEndTimestamp = timestamp;
      }
    })
    return { timelineStartTimestamp, timelineEndTimestamp }
  }

  const calculateMarginLeft = (requestTimestamp: number, timelineStartTimestamp: number, timelineLength: number): string => {
    return `${(requestTimestamp - timelineStartTimestamp + timelinePadding) / (timelineLength + 2 * timelinePadding) * 100}%`
  }

  const calculateMarginRight = (responseTimestamp: number, timelineEndTimestamp: number, timelineLength: number): string => {
    return `${(timelineEndTimestamp - responseTimestamp + timelinePadding) / (timelineLength + 2 * timelinePadding) * 100}%`
  }

  const generateBidderRows = (prebid: IPrebidDetails) => {
    const allBidderEvents: any[] = [];
    const allEventTimestamps: number[] = [];
    prebid?.events
      ?.filter(event => ['bidRequested', 'bidResponse', 'noBid'].includes(event.eventType))
      .forEach(event => {
        const index: number = allBidderEvents.findIndex(bidderRequest =>
          event.args.auctionId === bidderRequest.args.auctionId
          && (event.args.bidderCode === bidderRequest.args.bidderCode || event.args.bidder === bidderRequest.args.bidderCode));
        switch (event.eventType) {
          case 'bidRequested': {
            allEventTimestamps.push(event.args.start);
            allBidderEvents.push({ ...event, elapsedTime: event.elapsedTime });
            break;
          }
          case 'bidResponse': {
            allEventTimestamps.push(event.args.requestTimestamp);
            allEventTimestamps.push(event.args.responseTimestamp);
            allBidderEvents[index].args.endTimestamp = event.args.responseTimestamp;
            break;
          }
          case 'noBid': {
            allBidderEvents[index].args.endTimestamp = Math.floor(allBidderEvents[index].args.start + event.elapsedTime - allBidderEvents[index].elapsedTime);
            break
          }
        }
      });

    const { timelineStartTimestamp, timelineEndTimestamp } = updateTimelineTimestamps(allEventTimestamps);
    const timelineLength = timelineEndTimestamp - timelineStartTimestamp;

    return allBidderEvents
      .map(bidderRequest => ({
        label: bidderRequest.args.bidderCode,
        offset: bidderRequest.args.endTimestamp - bidderRequest.args.start,
        requestTimestamp: bidderRequest.args.start,
        responseTimestamp: bidderRequest.args.endTimestamp,
        marginLeft: calculateMarginLeft(bidderRequest.args.start, timelineStartTimestamp, timelineLength),
        marginRight: calculateMarginRight(bidderRequest.args.endTimestamp, timelineEndTimestamp, timelineLength)
      }))
      .sort((a, b) => a.requestTimestamp - b.requestTimestamp)
  }

  return (
    <table style={{ width: '100%', border: '1px dotted black' }}>
      <tbody>
        <tr style={{}}>
          <td >
            {generateBidderRows(prebid).map((row, index) =>
              <div style={{
                border: '1px solid orange',
                marginLeft: row.marginLeft,
                marginRight: row.marginRight,
                overflow: 'visible',
                maxHeight: '20px',
                fontSize: '10px',
                marginTop: '5px',
                marginBottom: '5px',
              }}
                key={index}>
                <p style={{ display: 'flex', whiteSpace: 'nowrap', overflow: 'visible' }}>{row.label}: {row.offset}ms</p>
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
  googleAdManager: IGoogleAdManagerDetails;
}

export default TimeLine;
