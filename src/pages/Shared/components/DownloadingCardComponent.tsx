import React, { useContext } from 'react';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { reloadPage } from '../utils';
import { CardContent } from '@mui/material';
import Typography from '@mui/material/Typography';
import InspectedPageContext from '../contexts/inspectedPageContext';

const DownloadingCardComponent = (): JSX.Element => {
  const inspectedPageState = useContext(InspectedPageContext);

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
            title="Downloading events..."
            subheader="Try to scroll down or click here to refresh the page."
          />
          <CardContent>
            <Typography variant="caption" sx={{ mr: 1, color: 'black', overflow: 'hidden', textAlign: 'left', zIndex: 0 }}>
              {inspectedPageState?.syncState}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default DownloadingCardComponent;
