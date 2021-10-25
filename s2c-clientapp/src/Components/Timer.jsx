import React from 'react'
import '../Styles/Timer.css';

const CountDownTimer = ({Secs, onTimeIsOver}) => {
   
    const [secs, setTime] = React.useState(Secs);
    

    const tick = () => {
   
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
    
    const reset = () => setTime(Secs);

    React.useEffect(() => {
        // ever second so every thousand mili seconds
        const timerId = setInterval(() => tick(), 1000);
        return () => clearInterval(timerId);
    });

    
    return (
        <div>
            <p>{`:${secs.toString().padStart(2, '0')}`}</p> 
        </div>
    );
}

export default CountDownTimer;
