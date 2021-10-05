import React from 'react';
import { IGoogleAdManagerDetails } from "../../../inject/scripts/googleAdManager";
import { IPrebidDetails } from "../../../inject/scripts/prebid";

const InfoComponent = ({ prebid, googleAdManager }: IInfoComponentProps): JSX.Element => {
  const allAvailableBids = prebid?.events?.filter(event => event.eventType === 'bidResponse') || [];
  const allNoBids = prebid?.events?.filter(event => event.eventType === 'noBid') || [];
  const allAdUnits = Array.from(new Set(prebid?.events?.filter(event => event.eventType === 'auctionInit').reduce((previousValue, currentValue) => [].concat(previousValue, currentValue.args.adUnitCodes), [])))
  const allBidders = Array.from(new Set([].concat(allAvailableBids, allNoBids).map(event => event?.args.bidder)))
  return <div>
    <ul className="stats-list">
      <li>GAM Slots Detected: {googleAdManager?.slots?.length}</li>
      <li>AdUnits Detected: {allAdUnits.length}</li>
      <li>Bidders: {allBidders.length}</li>
      <li>NoBid / Bid Ratio: {allNoBids.length} / {allAvailableBids.length}</li>
    </ul>
  </div>
};

interface IInfoComponentProps {
  googleAdManager: IGoogleAdManagerDetails;
  prebid: IPrebidDetails
}

export default InfoComponent;
