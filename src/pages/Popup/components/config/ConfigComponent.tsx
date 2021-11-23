import React from 'react';
import { IPrebidDetails } from '../../../../inject/scripts/prebid';
import { HashRouter as Router, Route, Link, Switch, useRouteMatch, useParams } from 'react-router-dom';
import PriceGranularityComponent from './PriceGranularityComponent';
import ModulesComponent from './ModulesComponent';
import Server2ServerComponent from './Server2ServerComponent';
import AnalyticsComponent from './AnalyticsComponent';
import PrivacyComponent from './PrivacyComponent';
import BidderSettingsComponent from './BidderSettingsComponent';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import EuroSharpIcon from '@mui/icons-material/EuroSharp';
import BusinessIcon from '@mui/icons-material/Business';
import DnsIcon from '@mui/icons-material/Dns';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/styles';
import { ITcfDetails } from '../../../../inject/scripts/tcf';

const NaviButton = styled(Button)({
  display: 'flex',
  flexDirection: 'column',
  color: '#0e86d4',
  border: '1px solid #0e86d4',
  width: '80px',
  textAlign: 'center',
  borderRadius: '10%',
  fontSize: '20px',
  '& .label': {
    fontSize: '10px',
  },
});

const ConfigComponent = ({ prebid, tcf }: IConfigComponentProps): JSX.Element => {
  const { url, path } = useRouteMatch();
  return (
    <Box>
      <Router>
        <Box
          sx={{
            padding: '5px 5px 5px 5px',
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          <Stack direction="column" spacing={0.5}>
            <Link to={`${url}/`}>
              <NaviButton size="small" variant="outlined" startIcon={<EuroSharpIcon />}>
                <Typography className="label">Price Granularity</Typography>
              </NaviButton>
            </Link>
            <Link to={`${url}/modules/`}>
              <NaviButton variant="outlined" startIcon={<BusinessIcon />}>
                <Typography className="label">Modules</Typography>
              </NaviButton>
            </Link>
            <Link to={`${url}/server`}>
              <NaviButton variant="outlined" startIcon={<DnsIcon />}>
                <Typography className="label">Server</Typography>
              </NaviButton>
            </Link>
            <Link to={`${url}/analytics`}>
              <NaviButton variant="outlined" startIcon={<AnalyticsIcon />}>
                <Typography className="label">Analytics</Typography>
              </NaviButton>
            </Link>
            <Link to={`${url}/privacy`}>
              <NaviButton variant="outlined" startIcon={<PrivacyTipIcon />}>
                <Typography className="label">Privacy</Typography>
              </NaviButton>
            </Link>
            <Link to={`${url}/biddersettings`}>
              <NaviButton variant="outlined" startIcon={<SettingsApplicationsIcon />}>
                <Typography className="label">Bidder Settings</Typography>
              </NaviButton>
            </Link>
          </Stack>

          <Switch>
            <Route exact path={path}>
              <PriceGranularityComponent prebid={prebid}></PriceGranularityComponent>
            </Route>
            <Route exact path={`${path}/modules/`}>
              {prebid.config && <ModulesComponent prebid={prebid}></ModulesComponent>}
            </Route>
            <Route exact path={`${url}/server`}>
              {prebid.config && <Server2ServerComponent prebid={prebid}></Server2ServerComponent>}
            </Route>
            <Route exact path={`${url}/analytics`}>
              {prebid.config && <AnalyticsComponent prebid={prebid}></AnalyticsComponent>}
            </Route>
            <Route exact path={`${url}/privacy`}>
              {prebid.config && <PrivacyComponent prebid={prebid} tcf={tcf}></PrivacyComponent>}
            </Route>
            <Route exact path={`${url}/biddersettings`}>
              {prebid.config && <BidderSettingsComponent prebid={prebid}></BidderSettingsComponent>}
            </Route>
          </Switch>
        </Box>
      </Router>
    </Box>
  );
};

interface IConfigComponentProps {
  prebid: IPrebidDetails;
  tcf: ITcfDetails;
}

export default ConfigComponent;
