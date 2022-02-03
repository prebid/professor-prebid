import React from 'react';
import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import Typography from '@mui/material/Typography';
import logger from '../../../../logger';
import Avatar from '@mui/material/Avatar';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { styled } from '@mui/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import { tileHeight } from './ConfigComponent';
interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
}));

const AnalyticsComponent = ({ prebid }: InalyticsComponentProps): JSX.Element => {
  const [expanded, setExpanded] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState<4 | 8>(4);
  const ref = React.useRef<HTMLInputElement>(null);

  const handleExpandClick = () => {
    setExpanded(!expanded);
    setMaxWidth(expanded ? 4 : 8);
    setTimeout(() => ref.current.scrollIntoView({ behavior: 'smooth' }), 150);
  };
  logger.log(`[PopUp][AnalyticsComponent]: render `);
  return (
    <Grid item xs={maxWidth} ref={ref}>
      <Card sx={{ width: 1, minHeight: tileHeight, border: '1px solid #0e86d4' }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: '#0e86d4' }} aria-label="recipe">
              <AnalyticsIcon />
            </Avatar>
          }
          title="Analytics"
          subheader={''}
          action={
            <ExpandMore expand={expanded} aria-expanded={expanded} aria-label="show more">
              <ExpandMoreIcon />
            </ExpandMore>
          }
          onClick={handleExpandClick}
        />
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            Todo
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
};

interface InalyticsComponentProps {
  prebid: IPrebidDetails;
}

export default AnalyticsComponent;
