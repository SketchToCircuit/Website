import React from 'react';
import GoogleLogin from 'react-google-login';

const responseGoogle = (response) => {
    console.log(response);
}

const clientId = '406203004756-j13sirg99go7roat5eqmecn5ue8ahld9.apps.googleusercontent.com';

class Login extends React.Component {
    render() {
        return (
            <GoogleLogin
            clientId={clientId}
            render={renderProps => (
            <button
                className='login-button'
                onClick={renderProps.onClick}
                disabled={renderProps.disabled}>Login via Google</button>)}
            buttonText="Login"
            onSuccess={responseGoogle}
            onFailure={responseGoogle}
            cookiePolicy={'single_host_origin'}/>)
    }
}
export default Login;
