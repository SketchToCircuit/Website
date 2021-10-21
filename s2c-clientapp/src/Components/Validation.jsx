import React from 'react';

import '../Styles/Validation.css';

class Validation extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            count: 1,
            enabledBtn: true
        };
    }

    onBtnClick(ok) {
        try {
            const ws = this.props.ws;

            const data = { "PacketId": 105, "Data": {
                  "imgId": this.props.wsData.imgId,
                  "count": this.state.count,
                  "validated": ok
                }
              };

            ws.send(JSON.stringify(data));
        } catch (e) {
        }

        if (this.state.count >= 5) {
            this.props.onFinished();
        }

        this.setState({
            enabledBtn: false
        });
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.wsData && prevProps.wsData !== this.props.wsData) {
            this.setState((state) => ({
                count: state.count + 1,
                enabledBtn: true
            }));
        }
    }

    render() {
        if (!this.props.wsData) {
            return null;
        }

        return (
            <div className='validation'>
                <h1>{this.props.wsData.hintText}</h1>
                <img src={this.props.wsData.valImg} alt=''></img>
                <img src={this.props.wsData.hintImg} alt=''></img>
                <button onClick={() => {this.onBtnClick(true)}} disabled={!this.state.enabledBtn}>Ok</button>
                <button onClick={() => {this.onBtnClick(false)}} disabled={!this.state.enabledBtn}>Not Ok</button>
            </div>
        );
    }
  }

export default Validation;