import React from 'react';

import '../Styles/Mainpage.css'

import Loginpage from './Loginpage'
import Validation from './Validation';
import Draw from './Draw'
import StartButton from './StartButton';

const ChildComponentEnum = Object.freeze({Login: 0, Draw: 1, Validation: 2, StartBtn: 3});

class Mainpage extends React.Component {
    timeout = 250; // Initial timeout duration as a class variable
    didCloseWs = false;

    constructor(props) {
        super(props);

        this.state = {
            ws: null,
            validationData: null,
            drawData: null,
            displayPage: ChildComponentEnum.Login
        };
    }

    componentDidMount() {
        this.connect();
        this.props.setShowNav(true);
    }

    componentDidUpdate(prevProps, prevState) {
        if (!this.props.loggedIn && prevProps.loggedIn) {
            this.setState({displayPage: ChildComponentEnum.Login});
            
            this.didCloseWs = true;
            try {
                this.state.ws.close();
                this.connect();
            } catch (error) {
                console.error(error);
            }
        }

        if (this.state.displayPage === ChildComponentEnum.Login || this.state.displayPage === ChildComponentEnum.StartBtn) {
            this.props.setShowNav(true);
        } else {
            this.props.setShowNav(false);
        }
    }

    componentWillUnmount() {
        this.props.setShowNav(true);
        
        if (this.state.ws) {
            this.didCloseWs = true;
            this.state.ws.close(); 
        }
    }

    onUserData(data){
        console.log(data.username + " has " + data.points);
        //console.log(data.scoreBoardData);
    }

    onDrawTaskMsg(data) {
        if (this.state.displayPage === ChildComponentEnum.StartBtn) {
            this.setState({
                displayPage: ChildComponentEnum.Draw,
                drawData: data
            });
        } else if (this.state.displayPage === ChildComponentEnum.Draw) {
            this.setState({
                drawData: data
            });
        }
    }

    onValidationTaskMsg(data) {
        if (this.state.displayPage === ChildComponentEnum.StartBtn) {
            this.setState({
                displayPage: ChildComponentEnum.Validation,
                validationData: data
            });
        } else if (this.state.displayPage === ChildComponentEnum.Validation) {
            this.setState({
                validationData: data
            });
        }
    }

    onDrawValFinished = () => {
        this.setState({
            displayPage: ChildComponentEnum.Login,
            validationData: null,
            drawData: null,
        });

        this.didCloseWs = true;
        
        try {
            this.state.ws.close();
            this.connect();
        } catch (error) {
            console.error(error);
        }
    }

    /**
    * @function connect
    * This function establishes the connection with the websocket and also ensures constant reconnection if connection closes
    */
    connect = () => {
        let that = this; // cache the this
        const url = 'wss:/' + window.location.hostname + '/api';
        let ws = new WebSocket(url);
        let connectInterval;

        // websocket onopen event listener
        ws.onopen = () => {
            console.log("Connected websocket main component");
            this.didCloseWs = false;
            this.setState({
                ws: ws,
                displayPage: ChildComponentEnum.Login
            });
            that.timeout = 250; // reset timer to 250 on open of websocket connection
            clearTimeout(connectInterval); // clear Interval on on open of websocket connection
        };

        // websocket onclose event listener
        ws.onclose = e => {
            if (!this.didCloseWs) {
                console.log(`Socket is closed. Reconnect will be attempted in ${Math.min(10000 / 1000, (that.timeout + that.timeout) / 1000)} second.`, e.reason);
                that.timeout *= 2; //increment retry interval
                connectInterval = setTimeout(this.check, Math.min(10000, that.timeout)); //call check function after timeout
            } else {
                console.log("Socket is closed.");
            }
        };

        // websocket onerror event listener
        ws.onerror = err => {
            console.error("Socket encountered error: ", err.message, "Closing socket");
            ws.close();
        };

        // message handler
        ws.onmessage = (event) => {
            try {
                const wsData = JSON.parse(event.data);
                switch (wsData.PacketId) {
                    case 201:
                        this.onUserData(wsData.Data);
                        break;

                    case 202:
                        this.onDrawTaskMsg(wsData.Data);
                        break;

                    case 203:
                        this.onValidationTaskMsg(wsData.Data);
                        break;

                    default:
                        break;
                }
            } catch (error) {
                console.error("Error in Websocket-Message");
            }
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

    loginCallback = (res) => {
        if (res && res.tokenId) {
            this.setState({displayPage: ChildComponentEnum.StartBtn});

            const data = {
                "PacketId": 101,
                "Data": {
                    "token": res.tokenId
                }
            }

            this.state.ws.send(JSON.stringify(data));
        }

        this.props.loginCallback(res);
    }

    render() {
        const ws = this.state.ws;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            return null;
        }

        if (this.state.displayPage === ChildComponentEnum.Login) {
            return(<Loginpage loginCallback={this.loginCallback}/>);
        } else if (this.state.displayPage === ChildComponentEnum.StartBtn) {
            return <StartButton ws={this.state.ws}/>
        } else if (this.state.displayPage === ChildComponentEnum.Validation) {
            return <Validation ws={this.state.ws} wsData={this.state.validationData} onFinished={this.onDrawValFinished}/>
        } else if (this.state.displayPage === ChildComponentEnum.Draw) {
            return <Draw ws={this.state.ws} wsData={this.state.drawData} onFinished={this.onDrawValFinished}/>
        }
    }
}

export default Mainpage;