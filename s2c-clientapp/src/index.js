import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';

import Mainpage from './Mainpage'
import Login from './Login'
import About from './About'
import NotFound from './NotFound'

import {BrowserRouter as Router, Switch, Route, Link} from "react-router-dom";

const App = () => {
    return (
        <div>
            <Router>
                <nav class="topnav">
                    <Link to="/" className='home-link'>SketchtoCircuit</Link>
                    <Link to="/Login">Login</Link>
                    <Link to="/About">About</Link>
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