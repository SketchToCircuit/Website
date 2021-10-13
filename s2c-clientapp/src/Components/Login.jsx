import React from 'react';
import {GoogleLogin} from 'react-google-login';
import { refreshToken } from '../utils/refreshToken';

const clientID = '406203004756-j13sirg99go7roat5eqmecn5ue8ahld9.apps.googleusercontent.com';

function Login(callback)
{
    const onSuccess = (res) => {
        refreshToken(res);
        callback.callback(res);
    };

    const onFailure = (res) => {
        console.log("Failed to log in");
    };

    return (
        <div>
            <GoogleLogin
                clientId={clientID}
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