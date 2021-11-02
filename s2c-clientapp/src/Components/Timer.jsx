import React from 'react'
import '../Styles/Timer.css';

class CountDownTimer extends React.Component{

    constructor(props) {
        super(props);

        this.state = {
            Secs: props.Secs
        };
    }

    reset = (time) => {
        if (time) {
            this.setState({Secs: time});
        } else {
            this.setState({Secs: this.props.Secs});
        }

        clearInterval(this.timerId);
        this.timerId = setInterval(this.tick, 1000);
    } 
  
    tick = () => {
        if (this.state.Secs <= 0)
        {
            this.props.onTimeIsOver();
        } 
        else
        {
            this.setState((state) => ({
                Secs: state.Secs - 1
            }));
        }
    };
    
    componentDidMount(){
        // ever second so every thousand mili seconds
        this.timerId = setInterval(this.tick, 1000);
    }

    componentWillUnmount(){
        clearInterval(this.timerId);
    }

    render () {
        return (
            <div className="timer" blink={this.state.Secs <= 6 ? '1' : '0'}>{this.state.Secs.toString().padStart(2, '0')} s</div>
        );
    }
}

export default CountDownTimer;
