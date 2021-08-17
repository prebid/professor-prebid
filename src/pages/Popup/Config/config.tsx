import * as React from 'react'
import { HashRouter as Router, Route, Link, Switch } from 'react-router-dom'
import { render } from 'react-dom';
import './config.scss';


class Config extends React.Component {
    render() {
        return (
            <Router>
                <div>
                    <nav>
                        <Link to="/">Price Granularity</Link>
                        <Link to="/modules">Modules</Link>
                        <Link to="/server">Server</Link>
                        <Link to="/analytics">Analytics</Link>
                        <Link to="/privacy">Privacy</Link>
                        <Link to="/biddersettings">Bidder Settings</Link>
                    </nav>
                    <Switch>
                        <Route exact path="/" component={PriceGranularity} />
                        <Route exact path="/modules" component={Modules} />
                        <Route exact path="/server" component={Server} />
                        <Route exact path="/analytics" component={Analytics} />
                        <Route exact path="/privacy" component={Privacy} />
                        <Route exact path="/biddersettings" component={BiderSettings} />
                    </Switch>
                </div>
            </Router>
        );
    } 
}