import React from 'react';
import './PrebidConfigComponent.scss';
import { IPrebidDetails } from "../../../../inject/scripts/prebid";
import { HashRouter as Router, Route, Link, Switch, useRouteMatch, useParams } from 'react-router-dom'
import PrebidConfigPricegranularityComponent from './PrebidConfigPricegranularityComponent';
import PrebidConfigModulesComponent from './PrebidConfigModulesComponent';
import PrebidConfigServerComponent from './PrebidConfigServerComponent';
import PrebidConfigAnalyticsComponent from './PrebidConfigAnalyticsComponent';
import PrebidConfigPrivacyComponent from './PrebidConfigPrivacyComponent';
import PrebidConfigBidderSettingsComponent from './PrebidConfigBidderSettingsComponent';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import EuroSharpIcon from '@mui/icons-material/EuroSharp';
import BusinessIcon from '@mui/icons-material/Business';
import DnsIcon from '@mui/icons-material/Dns';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import Typography from '@mui/material/Typography';


const PrebidConfigComponent = ({ prebid }: IPrebidConfigComponentProps): JSX.Element => {
  const { url, path } = useRouteMatch();
  return (
    <Box className="config-wrapper">
      <Router>
        <Box className="row-wrapper">
          <Box className="config-nav">
            <Link to={`${url}/`}>
              <Button size="small" variant="outlined" startIcon={<EuroSharpIcon />}>
                <Typography className="label">
                  Price Granularity
                </Typography>
              </Button>
            </Link>
            <Link to={`${url}/modules/`}>
              <Button variant="outlined" startIcon={<BusinessIcon />}>
                <Typography className="label">
                  Modules
                </Typography>
              </Button>
            </Link>
            <Link to={`${url}/server`}>
              <Button variant="outlined" startIcon={<DnsIcon />}>
                <Typography className="label">
                  Server
                </Typography>
              </Button>
            </Link>
            <Link to={`${url}/analytics`}>
              <Button variant="outlined" startIcon={<AnalyticsIcon />}>
                <Typography className="label">
                  Analytics
                </Typography>
              </Button>
            </Link>
            <Link to={`${url}/privacy`}>
              <Button variant="outlined" startIcon={<PrivacyTipIcon />}>
                <Typography className="label">
                  Privacy
                </Typography>
              </Button>
            </Link>
            <Link to={`${url}/biddersettings`}>
              <Button variant="outlined" startIcon={<SettingsApplicationsIcon />}>
                <Typography className="label">
                  Bidder Settings
                </Typography>
              </Button>
            </Link>
          </Box>
          <Switch>
            <Route exact path={path}>
              <PrebidConfigPricegranularityComponent prebid={prebid}></PrebidConfigPricegranularityComponent>
            </Route>
            <Route exact path={`${path}/modules/`}>
              <PrebidConfigModulesComponent prebid={prebid}></PrebidConfigModulesComponent>
            </Route>
            <Route exact path={`${url}/server`} >
              <PrebidConfigServerComponent prebid={prebid}></PrebidConfigServerComponent>
            </Route>
            <Route exact path={`${url}/analytics`} >
              <PrebidConfigAnalyticsComponent prebid={prebid}></PrebidConfigAnalyticsComponent>
            </Route>
            <Route exact path={`${url}/privacy`} >
              <PrebidConfigPrivacyComponent prebid={prebid}></PrebidConfigPrivacyComponent>
            </Route>
            <Route exact path={`${url}/biddersettings`} >
              <PrebidConfigBidderSettingsComponent prebid={prebid}></PrebidConfigBidderSettingsComponent>
            </Route>
          </Switch>
        </Box>
      </Router>
    </Box>
  )
}

interface IPrebidConfigComponentProps {
  prebid: IPrebidDetails;
}

export default PrebidConfigComponent;
