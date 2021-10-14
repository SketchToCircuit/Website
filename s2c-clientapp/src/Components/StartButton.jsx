import React from 'react';

import '../Styles/StartButton.css';

class StartButton extends React.Component {
    constructor(props) {
        super(props);
    }

    onBtnClick = () => {
        const ws = this.props.ws;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            return;
        } else {
            const data = {
                "PacketId": 103,
                "Data": {}
            }

            ws.send(JSON.stringify(data));
        }
    }

    render() {
        return (
            <div>
                <button className='start-button' onClick={() => this.onBtnClick()}><span>Start!</span></button>
            </div>);
    }
}

export default StartButton;