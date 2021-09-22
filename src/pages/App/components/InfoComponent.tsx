import React from 'react';
import { IGoogleAdManagerDetails } from "../../../inject/scripts/googleAdManager";
import { IPrebidDetails } from "../../../inject/scripts/prebid";

const InfoComponent: React.FC<IInfoComponentProps>  = ({prebid, googleAdManager}) => {
return (
    <div>
      <ul className="stats-list">
        <li>Ads Detected: {googleAdManager.slots.length}</li>
        <li>Bidders: {prebid.bids.map(bid=> bid.bidder).length}</li>
        <li>
          No Bid Ratio: {prebid.bids.map(bid=> bid.status === 'no bid').length} / {prebid.bids.map(bid=> bid.status === 'Bid available').length} 
        </li>
      </ul>
    </div>
  );
}

interface IInfoComponentProps {
  googleAdManager: IGoogleAdManagerDetails;
  prebid: IPrebidDetails
}


export default InfoComponent;