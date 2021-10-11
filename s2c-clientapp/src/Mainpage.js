import React from 'react';
import './Mainpage.css';
import Login from './Login'
import Validation from './Validation';
import Draw from './Draw'

class Mainpage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            ws: null,
            login: false,   // only temporarly, login detection will get implemented later
            validate: false,
            draw: true  // only temporarly
        };
    }

    componentDidMount() {
        this.connect();
    }

    timeout = 250; // Initial timeout duration as a class variable
    url = 'ws:/localhost:3000' // Websocket URL

    /**
    * @function connect
    * This function establishes the connect with the websocket and also ensures constant reconnection if connection closes
    */
    connect = () => {
        let that = this; // cache the this
        var ws = new WebSocket(that.url);
        var connectInterval;

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
            that.timeout = that.timeout + that.timeout; //increment retry interval
            connectInterval = setTimeout(this.check, Math.min(10000, that.timeout)); //call check function after timeout
        };

        // websocket onerror event listener
        ws.onerror = err => {
            console.error("Socket encountered error: ", err.message, "Closing socket");
            ws.close();
        };
    };

    /**
    * utilited by the @function connect to check if the connection is close, if so attempts to reconnect
    */
    check = () => {
        const {ws} = this.state;
        if (!ws || ws.readyState === WebSocket.CLOSED) 
            this.connect(); //check if websocket instance is closed, if so call `connect` function.
        };
    
    render() {
        if (this.state.login) {
            return <Login ws={this.state.ws}/>;
        } else if (this.state.validate) {
            return <Validation ws={this.state.ws}/>
        }else if (this.state.draw) {
            return <Draw ws={this.state.ws} />
        }
    }
}

export default Mainpage;