/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import Box from '@mui/material/Box';
import { PaapiAuctionsGridComponent } from './PaapiAuctionGridComponent';

const PaapiComponent = () => {
  return (
    <Box
      sx={{
        // display: 'flex',
        // flexDirection: 'column',
        // justifyContent: 'space-between',
        // rowGap: '10px',
        p: 1
      }}
    >
      <PaapiAuctionsGridComponent />
    </Box>
  );
};

export default PaapiComponent;
