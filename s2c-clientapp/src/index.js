import React, {useEffect, useState,} from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter as Router, Switch, Route, NavLink} from "react-router-dom";

import './index.css';

import Mainpage from './Components/Mainpage';
import About from './Components/About';
import NotFound from './Components/NotFound';
import Logout from './Components/Logout';
import Legal from './Components/Legal';

if ('ontouchstart' in window || window.matchMedia("(hover: none)").matches) {
    // Device is a touch device
    document.documentElement.classList.add('touch');
} else {
    document.documentElement.classList.add('no-touch');
}

const App = () => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [showNav, setShowNav] = useState(true);
    
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

    const updateShowNav = (val) => {
        if (showNav !== val) {
            setShowNav(val);
        }
    }

    useEffect(() => {
        if (window.location.pathname !== '/') {
            updateShowNav(true);
        }
    });

    return (
        <div>
            <Router>
                {false ? 
                    <nav className="topnav">
                        <NavLink activeStyle={{textShadow: "0px 0px 2px" }} exact to="/" className='home-link'>SketchToCircuit</NavLink>
                        <NavLink activeStyle={{textShadow: "0px 0px 2px" }} to="/About">About</NavLink>
                        {loggedIn ? <div className="logout"><Logout callback={logoutCallback}/></div> : null}
                    </nav> : null
                }

                <Switch>
                    <Route exact path="/" render={(props) => <Mainpage {...props} loginCallback={loginCallback} loggedIn={loggedIn} setShowNav={updateShowNav}/>}/>
                    <Route path="/About" component={About}/>
                    <Route path="/Legal" component={Legal}/>
                    <Route component={NotFound}/>
                </Switch>
            </Router>

            {showNav ? 
            <footer>
                <a href='/Legal'>Impressum – Legal Notice</a>
            </footer> : null
            }
        </div>
    );
}

ReactDOM.render(
<React.StrictMode>
    <App/>
</React.StrictMode>,
document.getElementById('root'));