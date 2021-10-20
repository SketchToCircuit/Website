import React from 'react';
import Login from './Login';

import '../Styles/Loginpage.css';

class Loginpage extends React.Component {
    render() {
        return (
            <div className='login-page'>
                <Login className='login-button' callback={this.props.loginCallback} o2Id={this.props.config.clientSettings.o2Id}/>
            </div>);
    }
}

export default Loginpage;