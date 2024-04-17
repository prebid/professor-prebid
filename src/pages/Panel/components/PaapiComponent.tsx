/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import Box from '@mui/material/Box';
import { AuctionsGridComponent } from './AuctionGridComponent';

const PaapiComponent = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        rowGap: '10px',
      }}
    >
      <AuctionsGridComponent />
    </Box>
  );
};

export default PaapiComponent;
