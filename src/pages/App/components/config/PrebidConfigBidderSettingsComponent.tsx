import React from 'react';
import { IPrebidDetails } from "../../../../inject/scripts/prebid";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
const PrebidConfigBidderSettingsComponent = ({ prebid }: PrebidConfigBidderSettingsComponentProps): JSX.Element => {
  return (
    <Box>
      <Typography><strong> Bidder Sequence: </strong>{prebid?.config?.bidderSequence}</Typography>
      <Typography><strong> Bidder Timeout: </strong>{prebid?.config?.bidderTimeout}</Typography>
      <Typography><strong> Send All Bids:</strong> {JSON.stringify(prebid?.config?.enableSendAllBids)}</Typography>
      <Typography><strong> Max Nested Iframes:</strong> {JSON.stringify(prebid?.config?.maxNestedIframes)}</Typography>
      <Typography><strong> Timeout Buffer: </strong>{JSON.stringify(prebid?.config?.timeoutBuffer)}</Typography>
      <Typography><strong> Use Bid Cache:</strong> {JSON.stringify(prebid?.config?.useBidCache)}</Typography>
      <Typography><strong> Bid Cache Url:</strong> {prebid?.config?.cache?.url}</Typography>
    </Box>
  );
}

interface PrebidConfigBidderSettingsComponentProps {
  prebid: IPrebidDetails
}

export default PrebidConfigBidderSettingsComponent;
