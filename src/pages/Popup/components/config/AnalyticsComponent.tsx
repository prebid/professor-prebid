import React from 'react';
import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import logger from '../../../../logger';

const AnalyticsComponent = ({ prebid }: InalyticsComponentProps): JSX.Element => {
  logger.log(`[PopUp][AnalyticsComponent]: render `);
  return (
    <Box sx={{ width: '100%', padding: '5px 5px 5px 25px' }}>
      <Typography>
        <strong>Analytics:</strong>ToDo
      </Typography>
    </Box>
  );
};

interface InalyticsComponentProps {
  prebid: IPrebidDetails;
}

export default AnalyticsComponent;
