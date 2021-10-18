import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { IPrebidDetails } from "../../../../inject/scripts/prebid";


const PrebidConfigServerComponent = ({ prebid }: PrebidConfigServerComponentProps): JSX.Element => {
  return (
    <Box>
      <Typography><strong>Adapter:</strong> {prebid?.config?.s2sConfig?.adapter}</Typography>
      <Typography><strong>Adapter Options:</strong> {JSON.stringify(prebid?.config?.s2sConfig?.adapterOptions)}</Typography>
      <Typography><strong>max. Bids:</strong> {prebid?.config?.s2sConfig?.maxBids}</Typography>
      <Typography><strong>Sync. Url Modifier:</strong> {JSON.stringify(prebid?.config?.s2sConfig?.syncUrlModifier)}</Typography>
      <Typography><strong>Timeout:</strong> {prebid?.config?.s2sConfig?.timeout}</Typography>
    </Box>
  );
}

interface PrebidConfigServerComponentProps {
  prebid: IPrebidDetails
}


export default PrebidConfigServerComponent;
