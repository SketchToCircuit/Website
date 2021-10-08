import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';

import Mainpage from './Mainpage'
import Login from './Login'
import About from './About'
import NotFound from './NotFound'

import {BrowserRouter as Router, Switch, Route, NavLink} from "react-router-dom";

const App = () => {
    return (
        <div>
            <Router>
                <nav className="topnav">
                    <NavLink activeStyle={{textShadow: "0px 0px 2px" }} exact to="/" className='home-link'>SketchtoCircuit</NavLink>
                    <NavLink activeStyle={{textShadow: "0px 0px 2px" }} to="/Login">Login</NavLink>
                    <NavLink activeStyle={{textShadow: "0px 0px 2px" }} to="/About">About</NavLink>
                </nav>

                <Switch>
                    <Route exact path="/" component={Mainpage}/>
                    <Route path="/Login" component={Login}/>
                    <Route path="/About" component={About}/>
                    <Route component={NotFound}/>
                </Switch>
            </Router>

            <footer>
                Fußzeile
            </footer>
        </div>
    );
}

ReactDOM.render(
<React.StrictMode>
    <App/>
</React.StrictMode>,
document.getElementById('root'));