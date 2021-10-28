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
                <div className="top">
                    <p className="instruction-paragraph">{this.props.wsData.hintText}</p>
                    <div className="btns-cnt">
                        <span className='counter'>{this.state.count}/5</span>
                        <div onClick={() => {this.onBtnClick(true)}}><img className='button' src={'ok_icon.svg'} role='button' alt=''></img></div>
                        <div onClick={() => {this.onBtnClick(false)}}><img className='button' src={'notok_icon.svg'}  role='button' alt=''></img></div>
                    </div>
                </div>
                <img className="val-image" src={this.props.wsData.valImg} alt=''></img>
                <div className="hint-div">
                    <img src={this.props.wsData.hintImg}
                        className="hint-picture"
                        alt=''
                        role='button'
                        large='0'
                        onClick={() => {
                            if (document.getElementsByClassName('hint-picture')[0].getAttribute('large') === '1') {
                                document.getElementsByClassName('hint-picture')[0].setAttribute('large', '0')
                            } else {
                                document.getElementsByClassName('hint-picture')[0].setAttribute('large', '1')
                            }
                        }}/>
                </div>
            </div>
        );
    }
  }

export default Validation;