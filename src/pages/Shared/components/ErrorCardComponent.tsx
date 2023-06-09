import React, { useContext, useRef } from 'react';
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import BugReportIcon from '@mui/icons-material/BugReport';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InspectedPageContext from '../contexts/inspectedPageContext';
import JSONViewerComponent from './JSONViewerComponent';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import LogoSvg from '../../../assets/Logo';
import { reloadPage } from '../utils';
import { Avatar } from '@mui/material';

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

const ErrorCardComponent = ({ error }: any) => {
  const context = useContext(InspectedPageContext);
  const { syncState } = context;
  const [expanded, setExpanded] = React.useState(false);
  const cardRef = useRef(null);
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  console.log({ cardRef });

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
        <Card sx={{ maxWidth: 0.75, minWidth: 0.75 }} ref={cardRef}>
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
              We apologize for the inconvenience, but it seems that an error has occurred.We highly value your privacy and therefore do not track any
              bugs or user activities.
            </Typography>
            <Typography variant="body1" paragraph>
              To help us improve your experience and resolve this issue, we kindly request you to consider opening an issue on our GitHub page.
            </Typography>
            <Typography variant="body1" paragraph>
              Your feedback is crucial in enhancing our extension and ensuring a seamless browsing experience for all our users.
            </Typography>
            <Typography variant="body1" paragraph>
              Thank you for your understanding and support!
            </Typography>
            <Typography variant="body1" paragraph>
              If you would like to help us resolve this issue, please click the button below to expand the error details and copy the contents of the
              error message.
            </Typography>
          </CardContent>
          <CardActions disableSpacing>
            <IconButton aria-label="report bug">
              <BugReportIcon />
            </IconButton>
            <ExpandMore expand={expanded} onClick={handleExpandClick} aria-expanded={expanded} aria-label="show more">
              <ExpandMoreIcon />
            </ExpandMore>
          </CardActions>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <CardContent>
              <Typography paragraph>Error:</Typography>
              <JSONViewerComponent src={{ error }} collapsed={3} />
            </CardContent>
            <CardContent>
              <Typography paragraph>Details:</Typography>
              <JSONViewerComponent src={context || { context: JSON.stringify(context) }} collapsed={3} />
            </CardContent>
          </Collapse>
        </Card>
      </Box>
    </Box>
  );
};

export default ErrorCardComponent;
