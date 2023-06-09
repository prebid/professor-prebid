import React, { useContext } from 'react';
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

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  return (
    // center card in screen
    <Box sx={{ backgroundColor: 'primary.light' }}>
      <Box id="florian" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#ABDDF' }}>
        <Card sx={{ maxWidth: 0.75, minWidth: 0.75 }}>
          <CardHeader
            // avatar={
            //   <Typography variant="h1" aria-label="Error">
            //     This is an Error
            //   </Typography>
            // }
            action={
              <IconButton aria-label="report bug">
                <BugReportIcon />
              </IconButton>
            }
            title="Oops! An Error Occurred"
            subheader={error?.message || syncState ? 'SyncState: ' + syncState : ''}
            // subheader={syncState ? 'SyncState: ' + syncState : ''}
          />
          {/* <CardMedia component="img" height="194" image="/static/images/cards/paella.jpg" alt="Paella dish" /> */}
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
            {/* <IconButton aria-label="share">
              <ShareIcon />
            </IconButton> */}
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
