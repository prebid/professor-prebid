import React from 'react';
import { IPrebidDetails } from "../../../../inject/scripts/prebid";

const PrebidConfigPrivacyComponent = ({ prebid }: PrebidConfigPrivacyComponentProps): JSX.Element => {
  return (
    <div>
      <p><strong>Allow Auction Without Consent: </strong>
        {JSON.stringify(prebid?.config?.consentManagement?.allowAuctionWithoutConsent)}
      </p>
      <p><strong>CMP api:</strong> {
        prebid?.config?.consentManagement?.cmpApi
          ?
          prebid?.config?.consentManagement?.cmpApi
          :
          prebid?.config?.consentManagement?.gdpr?.cmpApi
      }</p>
      <p><strong>Default GDPR Scope:</strong> {
        JSON.stringify(
          prebid?.config?.consentManagement?.defaultGdprScope
            ?
            prebid?.config?.consentManagement?.defaultGdprScope
            :
            prebid?.config?.consentManagement?.gdpr?.defaultGdprScope
        )
      }</p>
      <p><strong>Timeout:</strong> {
        prebid?.config?.consentManagement?.timeout
          ?
          prebid?.config?.consentManagement?.timeout
          :
          prebid?.config?.consentManagement?.gdpr.timeout
      }</p>
    </div>
  );
}

interface PrebidConfigPrivacyComponentProps {
  prebid: IPrebidDetails
}

export default PrebidConfigPrivacyComponent;
