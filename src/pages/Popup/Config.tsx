import * as React from 'react'
import { HashRouter as Router, Route, Link, Switch } from 'react-router-dom'
import { render } from 'react-dom';



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
                        <Route exact path="/" />
                        <Route exact path="/modules" />
                        <Route exact path="/server" />
                        <Route exact path="/analytics" />
                        <Route exact path="/privacy" />
                        <Route exact path="/biddersettings" />
                    </Switch>
                </div>
            </Router>
        );
    }
}
