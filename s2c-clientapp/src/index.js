import React, {useEffect, useState,} from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter as Router, Switch, Route, NavLink} from "react-router-dom";

import './index.css';

import Mainpage from './Components/Mainpage';
import About from './Components/About';
import NotFound from './Components/NotFound';
import Logout from './Components/Logout';
import Legal from './Components/Legal';
import Leaderboard from './Components/Leaderboard';

if ('ontouchstart' in window || window.matchMedia("(hover: none)").matches) {
    // Device is a touch device
    document.documentElement.classList.add('touch');
} else {
    document.documentElement.classList.add('no-touch');
}

const App = () => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [showNav, setShowNav] = useState(true);
    const [leaderboardData, setLeaderboardData] = useState(null);

    const loginCallback = (res) => {
        if (res && res.tokenId) {
            setLoggedIn(true);
        } else {
            setLoggedIn(false);
        }
    }

    const logoutCallback = () => {
        setLoggedIn(false);
        setLeaderboardData(null);
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

    let smallNav = false;
    if (window.innerWidth < 420) {
        smallNav = true;
    }
    
    return (
        <div>
            <Router>
                {false ? 
                    <nav className="topnav">
                        <NavLink activeStyle={{textShadow: "0px 0px 2px" }} exact to="/" className='home-link'>{smallNav ? 'S2C' : 'SketchToCircuit'}</NavLink>
                        <NavLink activeStyle={{textShadow: "0px 0px 2px" }} to="/About">About</NavLink>
                        <NavLink activeStyle={{textShadow: "0px 0px 2px" }} to="/Leaderboard">Scores</NavLink>
                        {true ? <div className="logout"><Logout callback={logoutCallback}/></div> : null}
                    </nav> : null
                }

                <Switch>
                    <Route exact path="/" render={(props) => <Mainpage {...props} loginCallback={loginCallback} loggedIn={loggedIn} setShowNav={updateShowNav} setLeaderboardData={setLeaderboardData}/>}/>
                    <Route path="/About" component={About}/>
                    <Route path="/Legal" component={Legal}/>
                    <Route path="/Leaderboard" render={(props) => <Leaderboard {...props} data={{
    "avatar": "https://lh3.googleusercontent.com/a/AATXAJy5d12ZvGvl0PLJ6IwsDb0rUYpICJuTb9UTiK-cpA=s96-c",
    "username": "Patrick Z",
    "points": 230,
    "scoreBoardData": [
        {
            "name": "Patrick Z",
            "score": 230
        },
        {
            "name": "Qualle 1638",
            "score": 140
        },
        {
            "name": "B.Robots RescueMaze",
            "score": 50
        }
    ],
    "unique": 15504
}}/>}/>
                    <Route component={NotFound}/>
                </Switch>
            </Router>

            {false ? 
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