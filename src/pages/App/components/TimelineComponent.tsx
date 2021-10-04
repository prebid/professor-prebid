import { IPrebidDetails } from "../../../inject/scripts/prebid";
import { IGoogleAdManagerDetails } from "../../../inject/scripts/googleAdManager";
import React from 'react';

class TimeLine extends React.Component<ITimelineComponentProps> {
  timelinePadding = 50;

  updateTimelineTimestamps = (timestampArray: number[]) => {
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

  calculateMarginLeft = (requestTimestamp: number, timelineStartTimestamp: number, timelineLength: number): string => {
    return `${(requestTimestamp - timelineStartTimestamp + this.timelinePadding) / (timelineLength + 2 * this.timelinePadding) * 100}%`
  }

  calculateMarginRight = (responseTimestamp: number, timelineEndTimestamp: number, timelineLength: number): string => {
    return `${(timelineEndTimestamp - responseTimestamp + this.timelinePadding) / (timelineLength + 2 * this.timelinePadding) * 100}%`
  }

  generateBidderRows = (prebid: IPrebidDetails) => {
    const allBidderEvents: any[] = [];
    const allEventTimestamps: number[] = [];
    prebid.events
      .filter(event => ['bidRequested', 'bidResponse', 'noBid'].includes(event.eventType))
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

    const { timelineStartTimestamp, timelineEndTimestamp } = this.updateTimelineTimestamps(allEventTimestamps);
    const timelineLength = timelineEndTimestamp - timelineStartTimestamp;

    return allBidderEvents
      .map(bidderRequest => ({
        label: bidderRequest.args.bidderCode,
        offset: bidderRequest.args.endTimestamp - bidderRequest.args.start,
        requestTimestamp: bidderRequest.args.start,
        responseTimestamp: bidderRequest.args.endTimestamp,
        marginLeft: this.calculateMarginLeft(bidderRequest.args.start, timelineStartTimestamp, timelineLength),
        marginRight: this.calculateMarginRight(bidderRequest.args.endTimestamp, timelineEndTimestamp, timelineLength)
      }))
      .sort((a, b) => a.requestTimestamp - b.requestTimestamp)
  }

  render = () => {
    let { prebid } = this.props;
    return (
      <table style={{ width: '100%', border: '1px dotted black' }}>
        <tbody>
          <tr style={{}}>
            <td >
              {this.generateBidderRows(prebid).map((row, index) =>
                <div
                  style={{
                    border: '1px solid orange',
                    marginLeft: row.marginLeft,
                    marginRight: row.marginRight,
                    overflow: 'visible',
                    maxHeight: '20px',
                    fontSize: '10px',
                    marginTop: '5px',
                    marginBottom: '5px',
                  }}
                  key={index}
                >
                  <p style={{ display: 'flex', whiteSpace: 'nowrap', overflow: 'visible' }}>{row.label}: {row.offset}ms</p>
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table >
    );
  };
}

interface ITimelineComponentProps {
  prebid: IPrebidDetails;
  googleAdManager: IGoogleAdManagerDetails;
}

export default TimeLine;