import React from 'react';
import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import logger from '../../../../logger';
import Collapse from '@mui/material/Collapse';
import Avatar from '@mui/material/Avatar';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import { styled } from '@mui/styles';
import Grid from '@mui/material/Grid';
import { tileHeight } from './ConfigComponent';

// should be subcomponent of ConsentManagementComponent

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

const ConsentModulesGdprComponent = ({ prebid }: IConsentModulesGdprComponentProps): JSX.Element => {
  const [expanded, setExpanded] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState<4 | 8>(4);

  const handleExpandClick = () => {
    setExpanded(!expanded);
    setMaxWidth(expanded ? 4 : 8);
  };

  logger.log(`[PopUp][ModulesComponent]: render `);
  return (
    <Grid item xs={maxWidth}>
      <Card sx={{ width: 1, minHeight: tileHeight, border: '1px solid #0e86d4' }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: '#0e86d4' }} aria-label="recipe">
              <ThumbUpIcon />
            </Avatar>
          }
          title="GDPR"
          subheader={``}
          action={
            <ExpandMore expand={expanded} onClick={handleExpandClick} aria-expanded={expanded} aria-label="show more">
              <ExpandMoreIcon />
            </ExpandMore>
          }
        />
        <CardContent>
          {prebid.config.consentManagement.gdpr.cmpApi && (
            <Typography variant="body2" color="text.secondary">
              <strong>CmpApi:</strong> {prebid.config.consentManagement.gdpr.cmpApi}
            </Typography>
          )}
          {prebid.config.consentManagement.gdpr.timeout && (
            <Typography variant="body2" color="text.secondary">
              <strong>Timeout:</strong> {prebid.config.consentManagement.gdpr.timeout}
            </Typography>
          )}
          {prebid.config.consentManagement.gdpr.defaultGdprScope && (
            <Typography variant="body2" color="text.secondary">
              <strong>defaultGdprScope:</strong> {JSON.stringify(prebid.config.consentManagement.gdpr.defaultGdprScope)}
            </Typography>
          )}
          {prebid.config.consentManagement.gdpr.allowAuctionWithoutConsent && (
            <Typography variant="body2" color="text.secondary">
              <strong>allowAuctionWithoutConsent:</strong> {prebid.config.consentManagement.gdpr.allowAuctionWithoutConsent}
            </Typography>
          )}
        </CardContent>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          {prebid.config.consentManagement.gdpr.rules && (
            <CardContent>
              <CardHeader title="GDPR Enforcement" />
              {prebid.config.consentManagement.gdpr.rules && (
                <React.Fragment>
                  {prebid.config.consentManagement.gdpr.rules.map((rule: any, index) => (
                    <List dense={true}>
                      <Typography>
                        <strong>Rules #{index}</strong>
                      </Typography>
                      {Object.keys(rule).map((key, index) => (
                        <ListItem key={index}>
                          {key}: {String(rule[key])}
                        </ListItem>
                      ))}
                    </List>
                  ))}
                </React.Fragment>
              )}
            </CardContent>
          )}
        </Collapse>
      </Card>
    </Grid>
  );
};

interface IConsentModulesGdprComponentProps {
  prebid: IPrebidDetails;
}

export default ConsentModulesGdprComponent;
