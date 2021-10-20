import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter as Router, Switch, Route, NavLink} from "react-router-dom";

import './index.css';

import Mainpage from './Components/Mainpage';
import About from './Components/About';
import NotFound from './Components/NotFound';
import Logout from './Components/Logout';

import config from './config.json'

const App = () => {
    const [loggedIn, setLoggedIn] = useState(false);
    
    const loginCallback = (res) => {
        if (res && res.tokenId) {
            setLoggedIn(true);
        } else {
            setLoggedIn(false);
        }
    }

    const logoutCallback = () => {
        setLoggedIn(false);
    }

    return (
        <div>
            <Router>
                <nav className="topnav">
                    <NavLink activeStyle={{textShadow: "0px 0px 2px" }} exact to="/" className='home-link'>SketchToCircuit</NavLink>
                    <NavLink activeStyle={{textShadow: "0px 0px 2px" }} to="/About">About</NavLink>
                    {loggedIn ? <div className="logout"><Logout callback={logoutCallback} o2Id={config.clientSettings.o2Id}/></div> : null}
                </nav>

                <Switch>
                    <Route exact path="/" render={(props) => <Mainpage {...props} loginCallback={loginCallback} loggedIn={loggedIn} config={config}/>}/>
                    <Route path="/About" component={About}/>
                    <Route component={NotFound}/>
                </Switch>
            </Router>

            <footer>
                <a>AGB</a>
            </footer>
        </div>
    );
}

ReactDOM.render(
<React.StrictMode>
    <App/>
</React.StrictMode>,
document.getElementById('root'));