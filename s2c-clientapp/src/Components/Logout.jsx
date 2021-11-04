import React from 'react';
import {GoogleLogout} from 'react-google-login';

function Logout(props){
    const onSucces = () => {
        props.callback();
    };

    return(
        <div>
            <GoogleLogout
                clientId={1}
                buttonText="Logout"
                onLogoutSuccess={onSucces}
                />
        </div>
    )
}

export default Logout