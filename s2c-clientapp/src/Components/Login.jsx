import React from 'react';
import {GoogleLogin} from 'react-google-login';
import { refreshToken } from '../utils/refreshToken';

function Login(props)
{
    const onSuccess = (res) => {
        refreshToken(res);
        props.callback(res);
    };

    const onFailure = (res) => {
        console.error("Failed to log in");
    };

    return (
        <div>
            <GoogleLogin
                clientId={process.env.REACT_APP_O2ID}
                buttonText="Login"
                onSuccess={onSuccess}
                onFailure={onFailure}
                cookiePolicy={'single_host_origin'}
                style={{ margin: '100px' }}
                isSignedIn={true}
                />
        </div>
    )
}
export default Login