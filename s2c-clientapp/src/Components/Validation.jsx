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
        if (!this.state.enabledBtn) {
            return;
        }

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

        if (this.state.count >= process.env.VALIDATING_COUNT) {
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
                        <span className='counter'>{this.state.count}/{process.env.VALIDATING_COUNT}</span>
                        <div onClick={() => {this.onBtnClick(true)}}><img className='button' src={'ok_icon.svg'} role='button' alt='' enabled={this.state.enabledBtn ? '1' : '0'}></img></div>
                        <div onClick={() => {this.onBtnClick(false)}}><img className='button' src={'notok_icon.svg'}  role='button' alt='' enabled={this.state.enabledBtn ? '1' : '0'}></img></div>
                    </div>
                </div>
                <img className="val-image" src={this.props.wsData.valImg} alt=''></img>
                
                <div    className="hint-div"
                        id="hint-div"
                        role='button'
                        large='0'
                        onClick={() => {
                            if (document.getElementById('hint-div').getAttribute('large') === '1') {
                                document.getElementById('hint-div').setAttribute('large', '0')
                            } else {
                                document.getElementById('hint-div').setAttribute('large', '1')
                            }}}>
                    <span>Example</span>
                    <img src={this.props.wsData.hintImg}
                        className="hint-picture"
                        alt=''/>
                </div>
            </div>
        );
    }
  }

export default Validation;