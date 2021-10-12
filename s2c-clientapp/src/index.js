import React, {useState} from 'react';
import ReactDOM from 'react-dom';

import './index.css';

import Mainpage from './Mainpage'
import About from './About'
import NotFound from './NotFound'

import Logout from './Components/Logout'

import {BrowserRouter as Router, Switch, Route, NavLink} from "react-router-dom";

const App = () => {
    const [loggedIn, setLoggedIn] = useState(false);

    const loginCallback = (res) => {
        if (res.tokenId !== undefined) {
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
                    {loggedIn ? <div className="logout"><Logout callback={logoutCallback}/></div> : null}
                </nav>

                <Switch>
                    <Route exact path="/" render={(props) => <Mainpage {...props} loginCallback={loginCallback} loggedIn={loggedIn}/>}/>
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