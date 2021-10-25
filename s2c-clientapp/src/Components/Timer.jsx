import React from 'react'
import '../Styles/Timer.css';

const CountDownTimer = ({Secs, onTimeIsOver, onreset}) => {
    const [secs, setTime] = React.useState(Secs);
    
    const reset = () => setTime(Secs);

    

    const tick = () => {

        if(onreset)
        {
            reset();
        }
   
        if (secs <= 0)
        {
            onTimeIsOver();
            reset();
        } 
         else
        {
            setTime([secs - 1]);
        }
    };
    
    React.useEffect(() => {
        // ever second so every thousand mili seconds
        const timerId = setInterval(() => tick(), 1000);
        return () => clearInterval(timerId);
    });

    
    return (
        <div className="timer">{secs.toString().padStart(2, '0')}</div>
    );
}

export default CountDownTimer;
