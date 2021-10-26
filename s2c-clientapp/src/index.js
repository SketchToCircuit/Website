import React, {useState,} from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter as Router, Switch, Route, NavLink} from "react-router-dom";

import './index.css';

import Mainpage from './Components/Mainpage';
import About from './Components/About';
import NotFound from './Components/NotFound';
import Logout from './Components/Logout';

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

    if (window.location.pathname !== '/') {
        updateShowNav(true);
    }

    return (
        <div>
            <Router>
                {
                    showNav ? 
                        <nav className="topnav">
                            <NavLink activeStyle={{textShadow: "0px 0px 2px" }} exact to="/" className='home-link'>SketchToCircuit</NavLink>
                            <NavLink activeStyle={{textShadow: "0px 0px 2px" }} to="/About">About</NavLink>
                            {loggedIn ? <div className="logout"><Logout callback={logoutCallback}/></div> : null}
                        </nav> : null
                }

                <Switch>
                    <Route exact path="/" render={(props) => <Mainpage {...props} loginCallback={loginCallback} loggedIn={loggedIn} setShowNav={updateShowNav}/>}/>
                    <Route path="/About" component={About}/>
                    <Route component={NotFound}/>
                </Switch>
            </Router>

            <footer>
                <a href='https://www.youtube.com/'>AGB &amp; Datenschutz</a>
            </footer>
        </div>
    );
}

ReactDOM.render(
<React.StrictMode>
    <App/>
</React.StrictMode>,
document.getElementById('root'));