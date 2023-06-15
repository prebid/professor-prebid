import React from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { reloadPage } from '../utils';
const NoPrebidCardComponent = (): JSX.Element => {
  return (
    <Box sx={{ backgroundColor: 'primary.light' }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#ABDDF' }}>
        <Card sx={{ maxWidth: 0.75, minWidth: 0.75 }}>
          <CardHeader
            action={
              <IconButton aria-label="share" onClick={reloadPage}>
                <RestartAltIcon />
              </IconButton>
            }
            title="No Prebid.js detected on this page."
            subheader="Try to scroll down or click here to refresh the page."
          />
        </Card>
      </Box>
    </Box>
  );
};

export default NoPrebidCardComponent;
