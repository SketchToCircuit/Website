import React from 'react';
import './Validation.css';

class Validation extends React.Component {
    // Access websocket here with "this.props.ws"
    // or if you need it more often: "const {ws} = this.props" und dann mit "ws."

    constructor(props) {
        super(props)

        this.state = {
            img_blob: ''    // BLOB Url of image; change state only with setState
        };
    }

    render() {
        return (
            <div className='validation'>
                <h1>Validation</h1>
                <img src={this.state.img_blob} alt=''></img>
            </div>
        );
    }
  }

export default Validation;