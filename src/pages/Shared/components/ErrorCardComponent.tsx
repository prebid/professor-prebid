import React, { useContext } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InspectedPageContext from '../contexts/inspectedPageContext';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import LogoSvg from '../../../assets/Logo';
import { reloadPage } from '../utils';
import { Avatar } from '@mui/material';

const ErrorCardComponent = ({ error }: any) => {
  const context = useContext(InspectedPageContext);
  const { syncState } = context;

  return (
    <Box sx={{ backgroundColor: 'primary.light' }}>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 10000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#ABDDF',
        }}
      ></Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#ABDDF' }}>
        <Card sx={{ maxWidth: 0.75, minWidth: 0.75 }}>
          <CardHeader
            avatar={
              <Avatar sx={{ backgroundColor: 'primary.light', width: 70, height: 70 }}>
                <LogoSvg width={50} height={50} />
              </Avatar>
            }
            action={
              <IconButton aria-label="share" onClick={reloadPage}>
                <RestartAltIcon />
              </IconButton>
            }
            title={<Typography variant="h1">Oops! An Error Occurred</Typography>}
            subheader={
              error?.message
                ? `Error Message: ${error.message}`
                : syncState && syncState !== '' && syncState !== 'null'
                ? 'SyncState: ' + syncState
                : ''
            }
          />
          <CardContent>
            <Typography variant="body1" paragraph>
              We apologize for the inconvenience, but it seems that an error has occurred. We highly value your privacy and therefore do not track any
              bugs or user activities.
            </Typography>
            <Typography variant="body1" paragraph>
              To help us improve your experience and resolve this issue, we kindly request you to consider opening an issue on our{' '}
              <span onClick={() => chrome.tabs.create({ url: 'https://github.com/prebid/professor-prebid/issues' })}>GitHub page</span>.
            </Typography>
            <Typography variant="body1" paragraph>
              Your feedback is crucial in enhancing our extension and ensuring a seamless browsing experience for all our users.
            </Typography>
            <Typography variant="body1" paragraph>
              Thank you for your understanding and support!
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ErrorCardComponent;
