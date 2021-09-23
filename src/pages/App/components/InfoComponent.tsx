import React from 'react';
import { IGoogleAdManagerDetails } from "../../../inject/scripts/googleAdManager";
import { IPrebidDetails } from "../../../inject/scripts/prebid";


class InfoComponent extends React.Component<IInfoComponentProps> {
  render() {
    const { prebid, googleAdManager } = this.props;
    return (
      <div>
        <ul className="stats-list">
          <li>Ads Detected: {googleAdManager.slots.length}</li>
          <li>Bidders: {Array.from(new Set(prebid.bids.map(bid => bid.bidder))).length}</li>
          <li>
            No Bid Ratio: {prebid.bids.filter(bid => bid.statusMessage === 'no bid').length} / {prebid.bids.filter(bid => bid.statusMessage === 'Bid available').length}
          </li>
        </ul>
      </div>
    );
  }
}

interface IInfoComponentProps {
  googleAdManager: IGoogleAdManagerDetails;
  prebid: IPrebidDetails
}


export default InfoComponent;