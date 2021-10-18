import React from 'react';

import '../Styles/Validation.css';

class Validation extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
        };
    }

    onBtnClick(ok) {
        
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
                <button onClick={() => {this.onBtnClick(true)}}>Ok</button>
                <button onClick={() => {this.onBtnClick(true)}}>Not Ok</button>
            </div>
        );
    }
  }

export default Validation;