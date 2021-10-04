import React from 'react';
import { IPrebidDetails } from "../../../../inject/scripts/prebid";

const PrebidConfigBidderSettingsComponent = ({ prebid }: PrebidConfigBidderSettingsComponentProps): JSX.Element => {
  return (
    <div>
      <p><strong> Bidder Sequence: </strong>{prebid.config?.bidderSequence}</p>
      <p><strong> Bidder Timeout: </strong>{prebid.config?.bidderTimeout}</p>
      <p><strong> Send All Bids:</strong> {JSON.stringify(prebid.config?.enableSendAllBids)}</p>
      <p><strong> Max Nested Iframes:</strong> {JSON.stringify(prebid.config?.maxNestedIframes)}</p>
      <p><strong> Timeout Buffer: </strong>{JSON.stringify(prebid.config?.timeoutBuffer)}</p>
      <p><strong> Use Bid Cache:</strong> {JSON.stringify(prebid.config?.useBidCache)}</p>
      <p><strong> Bid Cache Url:</strong> {prebid.config?.cache?.url}</p>
    </div>
  );
}

interface PrebidConfigBidderSettingsComponentProps {
  prebid: IPrebidDetails
}

export default PrebidConfigBidderSettingsComponent;
