import React from 'react';
import { IPrebidDetails } from "../../../../inject/scripts/prebid";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const PrebidConfigPrivacyComponent = ({ prebid }: PrebidConfigPrivacyComponentProps): JSX.Element => {
  return (
    <Box>
      <Typography><strong>Allow Auction Without Consent: </strong>
        {JSON.stringify(prebid?.config?.consentManagement?.allowAuctionWithoutConsent)}
      </Typography>
      <Typography><strong>CMP api:</strong> {
        prebid?.config?.consentManagement?.cmpApi
          ?
          prebid?.config?.consentManagement?.cmpApi
          :
          prebid?.config?.consentManagement?.gdpr?.cmpApi
      }</Typography>
      <Typography><strong>Default GDPR Scope:</strong> {
        JSON.stringify(
          prebid?.config?.consentManagement?.defaultGdprScope
            ?
            prebid?.config?.consentManagement?.defaultGdprScope
            :
            prebid?.config?.consentManagement?.gdpr?.defaultGdprScope
        )
      }</Typography>
      <Typography><strong>Timeout:</strong> {
        prebid?.config?.consentManagement?.timeout
          ?
          prebid?.config?.consentManagement?.timeout
          :
          prebid?.config?.consentManagement?.gdpr.timeout
      }</Typography>
    </Box>
  );
}

interface PrebidConfigPrivacyComponentProps {
  prebid: IPrebidDetails
}

export default PrebidConfigPrivacyComponent;
