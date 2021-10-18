import React from 'react';
import { IPrebidDetails } from "../../../../inject/scripts/prebid";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
const PrebidConfigModulesComponent = ({ prebid }: PrebidConfigModulesComponentProps): JSX.Element => {
  return (
    <Box>
      <Typography><strong>Modules:</strong>ToDo</Typography>
    </Box>
  );
}

interface PrebidConfigModulesComponentProps {
  prebid: IPrebidDetails
}

export default PrebidConfigModulesComponent;
