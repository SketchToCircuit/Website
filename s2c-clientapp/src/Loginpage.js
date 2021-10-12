import React from 'react';
import Login from './Components/Login';

const clientId = '406203004756-j13sirg99go7roat5eqmecn5ue8ahld9.apps.googleusercontent.com';

class Loginpage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loggedIn:   false
        }
    }

    render() {
        if (!this.state.loggedIn) {
            return (<Login className='login-button' callback={this.props.loginCallback}/>);
        } else {
            return (<></>);
        }
    }
}

export default Loginpage;