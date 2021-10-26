import React from 'react';

import '../Styles/StartButton.css';

class StartButton extends React.Component {
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
                <p className='start-text'>
                    You will either have to draw something in a given time or tell us if you see the correct image.<br/><br/>
                    If you need help you can click the small image to get a bigger preview.
                </p>
                <button className='start-button' onClick={() => this.onBtnClick()}><span>Start!</span></button>
            </div>);
    }
}

export default StartButton;