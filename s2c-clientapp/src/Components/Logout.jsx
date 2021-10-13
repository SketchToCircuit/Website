import React from 'react';
import {GoogleLogout} from 'react-google-login';

const clientID = '406203004756-j13sirg99go7roat5eqmecn5ue8ahld9.apps.googleusercontent.com';

function Logout(callback){
    const onSucces = () => {
        callback.callback();
    };

    return(
        <div>
            <GoogleLogout
                clientId={clientID}
                buttonText="Logout"
                onLogoutSuccess={onSucces}
                />
        </div>
    )
}

export default Logout