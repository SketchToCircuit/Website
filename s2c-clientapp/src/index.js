import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Mainpage from './Mainpage'
import Login from './Login'
import About from './About'

import {BrowserRouter as Router, Switch, Route, Link} from "react-router-dom";

const App = () => {
    return (
        <Router>
            <nav class="topnav">
                <Link to="/Home" className='home-link'>SketchtoCircuit</Link>
                <Link to="/Login">Login</Link>
                <Link to="/About">About</Link>
            </nav>

            <Switch>
                <Route path="/Home">
                    <Mainpage />
                </Route>
                <Route path="/Login">
                    <Login />
                </Route>
                <Route path="/About">
                    <About />
                </Route>
            </Switch>
        </Router>
    );
}

ReactDOM.render(
    <React.StrictMode>
    <App/>
</React.StrictMode>, document.getElementById('root'));