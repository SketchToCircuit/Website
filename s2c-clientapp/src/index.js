import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';

import Mainpage from './Mainpage'
import About from './About'
import NotFound from './NotFound'

import {BrowserRouter as Router, Switch, Route, NavLink} from "react-router-dom";

const App = () => {
    return (
        <div>
            <Router>
                <nav className="topnav">
                    <NavLink activeStyle={{textShadow: "0px 0px 2px" }} exact to="/" className='home-link'>SketchToCircuit</NavLink>
                    <NavLink activeStyle={{textShadow: "0px 0px 2px" }} to="/About">About</NavLink>
                </nav>

                <Switch>
                    <Route exact path="/" component={Mainpage}/>
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