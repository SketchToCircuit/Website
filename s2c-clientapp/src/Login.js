import React from 'react';
import GoogleLogin from 'react-google-login';

const responseGoogle = (response) => {
    console.log(response);
}

class Login extends React.Component {
    render() {
        return (
        <GoogleLogin
            clientId="197355798433-msk8hu5u74nlqsba1gf533flb3dkatgv.apps.googleusercontent.com"
            render={renderProps => (
            <button className='login-button' onClick={renderProps.onClick} disabled={renderProps.disabled}>Login via Google</button>
            )}
            buttonText="Login"
            onSuccess={responseGoogle}
            onFailure={responseGoogle}
            cookiePolicy={'single_host_origin'}/>
        )

    }
}
export default Login;
