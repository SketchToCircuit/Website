import React from 'react';
import './Validation.css';

class Validation extends React.Component {
    // Access websocket here with "this.props.ws" or if you need it more often:
    // "const {ws} = this.props" und dann mit "ws."

    constructor(props) {
        super(props)

        this.state = {
            imgSrc: '' // BLOB Url of image; change state only with setState
        };
    }

    componentDidMount() {
        this.updateImgSrc();
    }

    componentDidUpdate() {
        this.updateImgSrc();
    }

    updateImgSrc = () => {
        const data = this.props.wsData;

        if (data && data.imgSrc) {
            if (this.state.imgSrc !== data.imgSrc) {
                this.setState({imgSrc: data.imgSrc});
            }
        }
    }

    render() {
        return (
            <div className='validation'>
                <h1>Validation</h1>
                <img src={this.state.imgSrc} alt=''></img>
            </div>
        );
    }
}

export default Validation;