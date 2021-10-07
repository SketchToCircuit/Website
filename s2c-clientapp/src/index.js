import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Mainpage from './Mainpage'

import {BrowserRouter as Router, Switch, Route, Link} from "react-router-dom";

const App = () => {
    return (
        <Router>
            <div class="topnav">
                <a class="HomeLink" href="/">SketchtoCircuit</a>
                <a href="/Login">Login</a>
                <a href="/About">About</a>
            </div>
            
            <Switch>
                <Route path="/about">
                    <h1>About</h1>
                </Route>
                <Route path="/users">
                    <h1>Users</h1>
                </Route>
                <Route path="/">
                    <Mainpage/>
                </Route>
            </Switch>
        </Router>
    );
}

ReactDOM.render(
    <React.StrictMode>
    <App/>
</React.StrictMode>, document.getElementById('root'));