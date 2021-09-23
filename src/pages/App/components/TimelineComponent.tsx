import { IPrebidDetails } from "../../../inject/scripts/prebid";
import { IGoogleAdManagerDetails } from "../../../inject/scripts/googleAdManager";
import React from 'react';

class TimeLine extends React.Component<ITimelineComponentProps> {
  timelineStartTimestamp: number = null;
  timelineEndTimestamp: number = null;
  timelineLength: number = null;
  timelinePadding: number = 100;

  updateTimelineTimestamps = (input: number[]) => {
    input.forEach(timestamp => {
      if (timestamp < this.timelineStartTimestamp || this.timelineStartTimestamp === null) {
        this.timelineStartTimestamp = timestamp;
      }
      if (timestamp > this.timelineEndTimestamp || this.timelineEndTimestamp === null) {
        this.timelineEndTimestamp = timestamp;
      }
      this.timelineLength = (this.timelineEndTimestamp - this.timelineStartTimestamp);
    })
  }

  calculateMarginLeft = (requestTimestamp: number): string => {
    return `${(requestTimestamp - this.timelineStartTimestamp + this.timelinePadding) / (this.timelineLength + 2 * this.timelinePadding) * 100}%`
  }

  calculateMarginRight = (responseTimestamp: number): string => {
    return `${(this.timelineEndTimestamp - responseTimestamp + this.timelinePadding) / (this.timelineLength + 2 * this.timelinePadding) * 100}%`
  }

  generateBidderRows = (prebid: IPrebidDetails) => {
    return Object.keys(prebid.events.bidders).map(key => {
      const bidder = prebid.events.bidders[key];
      return {
        label: key,
        offset: bidder.responseTimestamp - bidder.requestTimestamp,
        requestTimestamp: bidder.requestTimestamp,
        responseTimestamp: bidder.responseTimestamp,
        marginLeft: this.calculateMarginLeft(bidder.requestTimestamp),
        marginRight: this.calculateMarginRight(bidder.responseTimestamp)
      }
    }).sort((a, b) => a.requestTimestamp - b.requestTimestamp)
  }

  generateGoogleAdManagerSlotRows = (googleAdManager: IGoogleAdManagerDetails) => {
    return Object.keys(googleAdManager.slotEvents).map(key => {
      const slotEventsArray = googleAdManager.slotEvents[key];
      // use postAuctionStartTimestamp and postAuctionEndTimestamp as fallback if events are missing
      const slotRequestedTimestamp = slotEventsArray.find(event => event.type === 'slotRequested')?.timestamp;
      const slotResponseReceivedTimestamp = slotEventsArray.find(event => event.type === 'slotResponseReceived')?.timestamp;
      return {
        label: key,
        offset: slotResponseReceivedTimestamp - slotRequestedTimestamp,
        requestTimestamp: slotRequestedTimestamp,
        responseTimestamp: slotResponseReceivedTimestamp,
        marginLeft: this.calculateMarginLeft(slotRequestedTimestamp),
        marginRight: this.calculateMarginRight(slotResponseReceivedTimestamp)
      }
    }).sort((a, b) => a.requestTimestamp - b.requestTimestamp);
  }

  generatePostAuctionRows = (googleAdManager: IGoogleAdManagerDetails) => {
    return [
      {
        label: 'google-ad-manager',
        offset: googleAdManager.postAuctionEndTimestamp - googleAdManager.postAuctionStartTimestamp,
        requestTimestamp: googleAdManager.postAuctionStartTimestamp,
        responseTimestamp: googleAdManager.postAuctionEndTimestamp,
        marginLeft: this.calculateMarginLeft(googleAdManager.postAuctionStartTimestamp),
        marginRight: this.calculateMarginRight(googleAdManager.postAuctionEndTimestamp)
      }
    ]
  }

  render = () => {
    let { prebid, googleAdManager } = this.props;
    // get lowest and highest timestamp for timeline start / stop 
    this.updateTimelineTimestamps([
      prebid.events.auctionStartTimestamp,
      prebid.events.auctionEndTimestamp,
      googleAdManager.postAuctionStartTimestamp,
      googleAdManager.postAuctionEndTimestamp
    ]);

    const dataRows = [
      ...this.generateBidderRows(prebid),
      ...this.generatePostAuctionRows(googleAdManager),
      // ...this.generateGoogleAdManagerSlotRows(googleAdManager), // un-comment to add lines/slot TODO handle missing events properly
    ];

    return (
      <table style={{ width: '100%', border: '1px dotted black' }}>
        <tbody>
          <tr style={{}}>
            <td >
              {dataRows.map((row, index) =>
                <div
                  style={{
                    border: '1px solid orange',
                    marginLeft: row.marginLeft,
                    marginRight: row.marginRight,
                    overflow: 'visible',
                    maxHeight: '20px',
                    fontSize: '10px'
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