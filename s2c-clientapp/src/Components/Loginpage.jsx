import React from 'react';
import Login from './Login';

import '../Styles/Loginpage.css';

class Loginpage extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (<Login className='login-button' callback={this.props.loginCallback}/>);
    }
}

export default Loginpage;