import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const AdMaskComponent = ({ creativeRenderTime, elementId, winningCPM, winningBidder, currency, timeToRespond }: IMaskInputData): JSX.Element => {
  return (
    <Box sx={{ textAlign: 'left', opacity: 1 }}>
      <Typography>
        <strong>Element Id: </strong>
        {elementId}
      </Typography>
      {/* <Typography><strong>creativeRenderTime: </strong>{creativeRenderTime}</Typography> */}
      {winningCPM && (
        <Typography>
          <strong>Winning CPM: </strong>
          {winningCPM} {currency}
        </Typography>
      )}
      {winningBidder && (
        <Typography>
          <strong>Winning Bidder: </strong>
          {winningBidder}
        </Typography>
      )}
      {timeToRespond && (
        <Typography>
          <strong>Time To Respond: </strong>
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
