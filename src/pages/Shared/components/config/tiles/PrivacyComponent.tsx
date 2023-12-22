import React, { useEffect, useContext } from 'react';
import Typography from '@mui/material/Typography';
import { ITcfDetails } from '../../../../Content/scripts/tcf';
import { TCString } from '@iabtcf/core';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BusinessIcon from '@mui/icons-material/Business';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import { tileHeight } from '../ConfigComponent';
import ListItem from '@mui/material/ListItem';
import CardContent from '@mui/material/CardContent';
import RenderKeyValueComponent from '../../RenderKeyValueComponent';
import InspectedPageContext from '../../../contexts/inspectedPageContext';
import AppStateContext from '../../../contexts/appStateContext';

const PrivacyComponent = (): JSX.Element => {
  const [expanded, setExpanded] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState<4 | 12>(4);
  const ref = React.useRef<HTMLInputElement>(null);

  const { tcf } = useContext(InspectedPageContext);
  const { prebid } = useContext(AppStateContext);
  const {
    config: { consentManagement },
  } = prebid;
  const { allowAuctionWithoutConsent, cmpApi, defaultGdprScope, gdpr, timeout, usp } = consentManagement || {};

  const handleExpandClick = () => {
    setExpanded(!expanded);
    setMaxWidth(expanded ? 4 : 12);
    setTimeout(() => ref.current.scrollIntoView({ behavior: 'smooth' }), 150);
  };

  if (!consentManagement) return null;
  return (
    <Grid item sm={maxWidth} xs={12} ref={ref}>
      <Card sx={{ width: 1, minHeight: tileHeight, maxHeight: expanded ? 'unset' : tileHeight }}>
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
            <RenderKeyValueComponent
              columns={[4, 12]}
              label="Allow Auction Without Consent"
              value={allowAuctionWithoutConsent || gdpr?.allowAuctionWithoutConsent}
              expanded={expanded}
            />
            <RenderKeyValueComponent columns={[4, 12]} label="CMP API" value={cmpApi} expanded={expanded} />
            <RenderKeyValueComponent columns={[4, 12]} label="Timeout" value={timeout} expanded={expanded} />
            <RenderKeyValueComponent columns={[4, 12]} label="Default GDPR Scope" value={defaultGdprScope} expanded={expanded} />
            <RenderKeyValueComponent columns={[4, 12]} label="CMP API" value={gdpr?.cmpApi} expanded={expanded} />
            <RenderKeyValueComponent columns={[4, 12]} label="Timeout" value={gdpr?.timeout} expanded={expanded} />
            <RenderKeyValueComponent columns={[4, 12]} label="Default GDPR Scope" value={gdpr?.defaultGdprScope} expanded={expanded} />
            <RenderKeyValueComponent columns={[4, 12]} label="GDPR Enforcement" value={gdpr?.rules?.length} expanded={expanded} />
            <RenderKeyValueComponent columns={[4, 12]} label="USP API" value={usp?.cmpApi} expanded={expanded} />
            <RenderKeyValueComponent columns={[4, 12]} label="Timeout" value={usp?.timeout} expanded={expanded} />
            <Grid item xs={12} />
            {gdpr?.rules?.map((rule, index) => (
              <RenderKeyValueComponent
                key={index}
                columns={[4, 4]}
                label={`Rule #${index + 1}`}
                value={
                  <>
                    {Object.keys(rule).map((key, index) => (
                      <ListItem key={index}>
                        {key}: {String(rule[key as keyof typeof rule])}
                      </ListItem>
                    ))}
                  </>
                }
                expanded={expanded}
              />
            ))}
            <Grid item xs={12} />
            {tcf && Object.keys(tcf).map((key, index) => <TcfComponent key={index} tcf={tcf} tcfKey={key} expanded={expanded} />)}
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
    <React.Fragment>
      <RenderKeyValueComponent columns={[4, 12]} label="TCF Version" value={tcfKey} expanded={expanded} />
      <RenderKeyValueComponent columns={[4, 12]} label="CMP Loaded" value={tcf[tcfKey]?.cmpLoaded} expanded={expanded} />
      <Grid item xs={12} />
      <RenderKeyValueComponent
        columns={[4, 12]}
        label="Consent Data"
        value={tcf[tcfKey]?.consentData ? tcf[tcfKey].consentData : 'no consent string found'}
        expanded={expanded}
      />
      <Grid item xs={12} />
      <RenderKeyValueComponent columns={[4, 12]} label="Decoded Consent String" value={decodedTcfString} expanded={expanded} />
    </React.Fragment>
  );
};

interface TcfComponentProps {
  tcf: ITcfDetails;
  tcfKey: string;
  expanded: boolean;
}

export default PrivacyComponent;
