import React, { forwardRef } from 'react'
import '../Styles/Timer.css';

class CountDownTimer extends React.Component{

    constructor(props) {
        super(props);

        this.state = {
            Secs: props.Secs
        };
    }

    reset = () =>{this.setState({Secs: this.props.Secs})} 
  
    tick = () => {
   
        if (this.state.Secs <= 0)
        {
            this.props.onTimeIsOver();
            this.reset();
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
            <div className="timer">{this.state.Secs.toString().padStart(2, '0')} s</div>
        );
    }
}

export default CountDownTimer;
