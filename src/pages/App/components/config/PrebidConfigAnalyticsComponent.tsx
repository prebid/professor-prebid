import React from 'react';
import { IPrebidDetails } from "../../../../inject/scripts/prebid";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const PrebidConfigAnalyticsComponent = ({ prebid }: PrebidConfigAnalyticsComponentProps): JSX.Element => {
  return (
    <Box>
      <Typography><strong>Analytics:</strong>ToDo</Typography>
    </Box>
  );
}

interface PrebidConfigAnalyticsComponentProps {
  prebid: IPrebidDetails
}

export default PrebidConfigAnalyticsComponent;
