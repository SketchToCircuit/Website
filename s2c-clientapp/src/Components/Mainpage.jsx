import React from 'react';

import Loginpage from './Loginpage'
import Validation from './Validation';
import Draw from './Draw'

const ChildComponentEnum = Object.freeze({Login: 0, Draw: 1, Validation: 2})

class Mainpage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            ws: null,
            validationData: null, // Data for validation of images from websocket
            displayPage: ChildComponentEnum.Login // what site should be displayed
        };
    }

    componentDidUpdate(prevProps, prevState) {
        if (!this.props.loggedIn && prevProps.loggedIn) {
            this.setState({
                displayPage: ChildComponentEnum.Login
            });
        }
    }

    componentDidMount() {
        this.connect();
    }

    timeout = 250; // Initial timeout duration as a class variable

    /**
    * @function connect
    * This function establishes the connect with the websocket and also ensures constant reconnection if connection closes
    */
    connect = () => {
        let that = this; // cache the this
        const url = 'wss:/' + window.location.hostname + ':3001';
        let ws = new WebSocket(url);
        let connectInterval;

        // websocket onopen event listener
        ws.onopen = () => {
            console.log("connected websocket main component");
            this.setState({ws: ws});
            that.timeout = 250; // reset timer to 250 on open of websocket connection
            clearTimeout(connectInterval); // clear Interval on on open of websocket connection
        };

        // websocket onclose event listener
        ws.onclose = e => {
            console.log(`Socket is closed. Reconnect will be attempted in ${Math.min(10000 / 1000, (that.timeout + that.timeout) / 1000)} second.`, e.reason);
            that.timeout *= 2; //increment retry interval
            connectInterval = setTimeout(this.check, Math.min(10000, that.timeout)); //call check function after timeout
        };

        // websocket onerror event listener
        ws.onerror = err => {
            console.error("Socket encountered error: ", err.message, "Closing socket");
            ws.close();
        };

        // message handler
        ws.onmessage = this.onWsMessage;
    };

    /**
    * utilited by the @function connect to check if the connection is close, if so attempts to reconnect
    */
    check = () => {
        const {ws} = this.state;
        if (!ws || ws.readyState === WebSocket.CLOSED) 
            this.connect(); //check if websocket instance is closed, if so call `connect` function.
        };
    
    /**
    * handles messages from websocket
    */
    onWsMessage = (event) => {
        const wsData = JSON.parse(event.data);
        try {
            if (wsData.data.type === 'VALIDATION') {
                this.setState({validationData: wsData.data, displayPage: ChildComponentEnum.Validation});
            }
        } catch (error) {
            console.log("Error in Websocket-Message");
        }
    };

    loginCallback = (res) => {
        if (res.tokenId !== undefined) {
            this.setState({
                displayPage: ChildComponentEnum.Validation
            });

            this.props.loginCallback(res);
        }
    }

    render() {
        if (this.state.displayPage === ChildComponentEnum.Login) {
            return <Loginpage ws={this.state.ws} wsData={null} loginCallback={this.loginCallback}/>;
        } else if (this.state.displayPage === ChildComponentEnum.Validation) {
            return <Validation ws={this.state.ws} wsData={this.state.validationData}/>
        } else if (this.state.displayPage === ChildComponentEnum.Draw) {
            return <Draw ws={this.state.ws} wsData={null}/>
        }
    }
}

export default Mainpage;