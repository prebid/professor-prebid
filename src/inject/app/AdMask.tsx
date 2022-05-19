import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const AdMaskComponent = ({ creativeRenderTime, elementId, winningCPM, winningBidder, currency, timeToRespond }: IMaskInputData): JSX.Element => {
  return (
    <Box sx={{ textAlign: 'left', opacity: 1 }}>
      <Typography>
        {elementId}
      </Typography>
      {/* <Typography><strong>creativeRenderTime: </strong>{creativeRenderTime}</Typography> */}
      {winningCPM && (
        <Typography>
          <strong>CPM </strong>
          {winningCPM} {currency}
        </Typography>
      )}
      {winningBidder && (
        <Typography>
          <strong>Bidder </strong>
          {winningBidder}
        </Typography>
      )}
      {timeToRespond && (
        <Typography>
          <strong>TTR </strong>
          {timeToRespond}ms
        </Typography>
      )}
    </Box>
  );
};

export interface IMaskInputData {
  elementId: string;
  creativeRenderTime: number;
  winningBidder: string;
  winningCPM: number;
  currency: string;
  timeToRespond: number;
}

export default AdMaskComponent;
