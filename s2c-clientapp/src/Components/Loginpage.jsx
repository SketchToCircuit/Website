import React from 'react';
import Login from './Login';

import '../Styles/Loginpage.css';

class Loginpage extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (<Login className='login-button' callback={this.props.loginCallback} o2Id={this.props.config.clientSettings.o2Id}/>);
    }
}

export default Loginpage;