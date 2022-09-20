import React, { useEffect } from 'react';
import { IPrebidConfigConsentManagement } from '../../../../inject/scripts/prebid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ITcfDetails } from '../../../../inject/scripts/tcf';
import { TCString } from '@iabtcf/core';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BusinessIcon from '@mui/icons-material/Business';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import JSONViewerComponent from '../../../Shared/JSONViewerComponent';
import Grid from '@mui/material/Grid';
import { tileHeight } from './ConfigComponent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import CardContent from '@mui/material/CardContent';

const PrivacyComponent = ({ consentManagement, tcf }: IPrivacyComponentProps): JSX.Element => {
  const [expanded, setExpanded] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState<4 | 12>(4);
  const ref = React.useRef<HTMLInputElement>(null);

  const handleExpandClick = () => {
    setExpanded(!expanded);
    setMaxWidth(expanded ? 4 : 12);
    setTimeout(() => ref.current.scrollIntoView({ behavior: 'smooth' }), 150);
  };
  const tileWidth = expanded ? 4 : 12;
  return (
    <Grid item md={maxWidth} xs={12} ref={ref}>
      <Card sx={{ width: 1, minHeight: tileHeight }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <BusinessIcon />
            </Avatar>
          }
          title={<Typography variant="h3">Consent Management</Typography>}
          subheader={<Typography variant="subtitle1">TCF, CPA, USP, ...</Typography>}
          action={
            <ExpandMoreIcon
              sx={{
                transform: !expanded ? 'rotate(0deg)' : 'rotate(180deg)',
                marginLeft: 'auto',
              }}
            />
          }
          onClick={handleExpandClick}
        />
        <CardContent>
          <Grid container spacing={2}>
            {consentManagement.allowAuctionWithoutConsent !== undefined && (
              <Grid item xs={12} sm={tileWidth}>
                <Typography variant="body1">
                  <strong>Allow Auction Without Consent:</strong>
                  {String(consentManagement?.allowAuctionWithoutConsent)}
                </Typography>
              </Grid>
            )}
            {consentManagement.cmpApi && (
              <Grid item xs={12} sm={tileWidth}>
                <Typography variant="body1">
                  <strong>CMPApi: </strong>
                  {String(consentManagement.cmpApi)}
                </Typography>
              </Grid>
            )}
            {consentManagement.defaultGdprScope && (
              <Grid item xs={12} sm={tileWidth}>
                <Typography variant="body1">
                  <strong>Default GDPR Scope: </strong>
                  {consentManagement.defaultGdprScope ? 'true' : 'false'}
                </Typography>
              </Grid>
            )}
            {consentManagement.timeout && (
              <Grid item xs={12} sm={tileWidth}>
                <Typography variant="body1">
                  <strong>Timeout: </strong>
                  {consentManagement.timeout}
                </Typography>
              </Grid>
            )}
            {consentManagement.gdpr && (
              <Grid item xs={12} sm={tileWidth}>
                <Typography variant="body1">
                  <strong>GDPR</strong>
                </Typography>
              </Grid>
            )}
            {consentManagement.gdpr?.cmpApi && (
              <Grid item xs={12} sm={tileWidth}>
                <Typography variant="body1">
                  <strong>CmpApi:</strong> {consentManagement.gdpr.cmpApi}
                </Typography>
              </Grid>
            )}
            {consentManagement.gdpr?.timeout && (
              <Grid item xs={12} sm={tileWidth}>
                <Typography variant="body1">
                  <strong>Timeout:</strong> {consentManagement.gdpr.timeout}
                </Typography>
              </Grid>
            )}
            {consentManagement.gdpr?.defaultGdprScope && (
              <Grid item xs={12} sm={tileWidth}>
                <Typography variant="body1">
                  <strong>defaultGdprScope:</strong> {JSON.stringify(consentManagement.gdpr.defaultGdprScope)}
                </Typography>
              </Grid>
            )}
            {consentManagement.gdpr?.allowAuctionWithoutConsent && (
              <Grid item xs={12} sm={tileWidth}>
                <Typography variant="body1">
                  <strong>allowAuctionWithoutConsent:</strong> {consentManagement.gdpr.allowAuctionWithoutConsent}
                </Typography>
              </Grid>
            )}
            {expanded && consentManagement.gdpr?.rules && (
              <Grid item xs={12} sm={12}>
                <Typography variant="body1">
                  <strong>GDPR Enforcement: </strong> {consentManagement.gdpr?.rules.length > 0 ? consentManagement.gdpr?.rules.length : '0'} rules
                </Typography>
              </Grid>
            )}
            {expanded &&
              consentManagement.gdpr?.rules &&
              consentManagement.gdpr.rules.map((rule, index) => (
                <Grid item xs={12} sm={4}>
                  <List dense={true} key={index}>
                    <Typography>
                      <strong>Rules #{index}</strong>
                    </Typography>
                    {Object.keys(rule).map((key, index) => (
                      <ListItem key={index}>
                        {key}: {String(rule[key as keyof typeof rule])}
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              ))}

            {expanded && consentManagement.usp?.cmpApi && (
              <Grid item xs={12} sm={12}>
                <Typography variant="body1">
                  <strong>USP:</strong> {consentManagement.usp.cmpApi}
                </Typography>
              </Grid>
            )}
            {expanded && consentManagement.usp?.cmpApi && (
              <Grid item xs={12} sm={12}>
                <Typography variant="body1">
                  <strong>CmpApi:</strong> {consentManagement.usp.cmpApi}
                </Typography>
              </Grid>
            )}
            {expanded && consentManagement.usp?.timeout && (
              <Grid item xs={12} sm={12}>
                <Typography variant="body1">
                  <strong>Timeout:</strong> {consentManagement.usp.timeout}
                </Typography>
              </Grid>
            )}

            {expanded && consentManagement.gdpr?.rules && (
              <Grid item xs={12} sm={12}>
                <Typography variant="body1">
                  <strong>GDPR Enforcement:</strong> {consentManagement.usp.timeout}
                </Typography>
              </Grid>
            )}

            {expanded && consentManagement.gdpr?.rules && (
              <Grid item xs={12} sm={12}>
                {consentManagement.gdpr.rules.map((rule, index) => (
                  <List dense={true}>
                    <Typography>
                      <strong>Rule #{index}</strong>
                    </Typography>
                    {Object.keys(rule).map((key, index) => (
                      <ListItem key={index}>
                        {key}: {String(rule[key as keyof typeof rule])}
                      </ListItem>
                    ))}
                  </List>
                ))}
              </Grid>
            )}

            {expanded && Object.keys(tcf).map((key, index) => <TcfComponent key={index} tcf={tcf} tcfKey={key} expanded={expanded} />)}
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

const TcfComponent = ({ tcf, tcfKey, expanded }: TcfComponentProps): JSX.Element => {
  const [decodedTcfString, setDecodedTcfString] = React.useState({});
  useEffect(() => {
    const string = tcf[tcfKey]?.consentData || '';
    let decodedTcfString = {};
    try {
      decodedTcfString = TCString.decode(string, null);
    } catch (e) {}
    setDecodedTcfString(decodedTcfString);
  }, [tcf, tcfKey]);
  return (
    expanded && (
      <React.Fragment>
        <Grid item xs={4}>
          <Typography variant="body1">
            <strong>TCF</strong> {tcfKey}
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="body1">
            <strong>Version:</strong> {tcfKey}
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant="body1">
            <strong>CMP Loaded: </strong> {String(tcf[tcfKey]?.cmpLoaded)}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ pb: 1 }}>
            <TextField
              label="Consent Data:"
              multiline
              variant="outlined"
              value={tcf[tcfKey]?.consentData ? tcf[tcfKey].consentData : 'no consent string found'}
              sx={{ width: 1 }}
            />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <JSONViewerComponent
            src={decodedTcfString}
            name={false}
            collapsed={false}
            displayObjectSize={false}
            displayDataTypes={false}
            sortKeys={false}
            quotesOnKeys={false}
            indentWidth={2}
            collapseStringsAfterLength={100}
            style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
          />
        </Grid>
      </React.Fragment>
    )
  );
};
interface IPrivacyComponentProps {
  consentManagement: IPrebidConfigConsentManagement;
  tcf: ITcfDetails;
}

interface TcfComponentProps {
  tcf: ITcfDetails;
  tcfKey: string;
  expanded: boolean;
}

export default PrivacyComponent;
