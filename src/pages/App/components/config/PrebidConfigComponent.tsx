import React from 'react';
import { IPrebidDetails } from "../../../../inject/scripts/prebid";
import { HashRouter as Router, Route, Link, Switch, useRouteMatch, useParams } from 'react-router-dom'
import PrebidConfigPricegranularityComponent from './PrebidConfigPricegranularityComponent';
import PrebidConfigModulesComponent from './PrebidConfigModulesComponent';
import PrebidConfigServerComponent from './PrebidConfigServerComponent';
import PrebidConfigAnalyticsComponent from './PrebidConfigAnalyticsComponent';
import PrebidConfigPrivacyComponent from './PrebidConfigPrivacyComponent';
import PrebidConfigBidderSettingsComponent from './PrebidConfigBidderSettingsComponent';

const PrebidConfigComponent = ({ prebid }: IPrebidConfigComponentProps): JSX.Element => {
  const { url, path } = useRouteMatch();
  return (
    <div>
      <Router>
        <div>
          <nav>
            <Link to={`${url}/`}><button>Price Granularity</button></Link>
            <Link to={`${url}/modules/`}><button>Modules</button></Link>
            <Link to={`${url}/server`}><button>Server</button></Link>
            <Link to={`${url}/analytics`}><button>Analytics</button></Link>
            <Link to={`${url}/privacy`}><button>Privacy</button></Link>
            <Link to={`${url}/biddersettings`}><button>Bidder Settings</button></Link>
          </nav>
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
        </div>
      </Router>
      
      {/* <pre>
        {JSON.stringify(prebid.config, null, 4)}
      </pre> */}
    </div>
  )
}

interface IPrebidConfigComponentProps {
  prebid: IPrebidDetails;
}

export default PrebidConfigComponent;
