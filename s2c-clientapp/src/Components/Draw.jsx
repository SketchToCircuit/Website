import React, {createRef} from 'react';
import CanvasDraw from "react-canvas-draw";

import CountDownTimer from './Timer';
import '../Styles/Draw.css';

class Draw extends React.Component {
    componentimage = null;

    constructor(props) {
        super(props)

        this.timerRef = createRef();
        this.forceResize = false;

        // set custom vh-unit for mobile devices
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);

        this.state = {
            hintpicture: props.wsData.ComponentHint.img,
            hinttext: props.wsData.ComponentHint.text,
            isfirstDrawn: false,
            backgroundpic: "",
            canvHeight: 0,
            canvWidth: 0,
            unmountDrawing: false,
            batchcount: 1,
            type: props.wsData.type
        };
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleResize, true);

        this.setState({
            canvHeight: document.getElementsByClassName('canvasSizePlaceholder')[0].offsetHeight,
            canvWidth: window.innerWidth,
        });
    }
      
    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }
    
    handleResize = () => {
        this.setState({
            canvHeight: document.getElementsByClassName('canvasSizePlaceholder')[0].offsetHeight,
            canvWidth: window.innerWidth,
        });

        // set custom vh-unit for mobile devices
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.wsData !== this.props.wsData) {
            this.setState({hintpicture: this.props.wsData.ComponentHint.img, 
                           hinttext: this.props.wsData.ComponentHint.text,
                           type: this.props.wsData.type});
        }

        if (this.state.unmountDrawing) {
            this.setState({
                unmountDrawing: false
            });
        }
    }

    onButtonNext = () => {
        this.timerRef.current.reset();
        if (!this.state.isfirstDrawn) {
            this.componentimage = this.saveableCanvas.canvas.drawing.toDataURL("image/png");
            this.saveableCanvas.clear();
            this.setState((state) => ({
                backgroundpic: this.componentimage,
                isfirstDrawn: true,
                hinttext: this.props.wsData.LabelHint.text,
                hintpicture: this.props.wsData.LabelHint.img,
                unmountDrawing: true
            }));

        } else {

            this.setState((state) => ({
                backgroundpic: "",
                isfirstDrawn: false,
                unmountDrawing: true
            }));

            const data = {
                "PacketId": 104,
                "Data": {
                    "count": this.state.batchcount,
                    "type": this.state.type,
                    "componentImg": this.componentimage,
                    "labelImg": this.saveableCanvas.canvas.drawing.toDataURL("image/png")
                }
            }

            try {
                this.props.ws.send(JSON.stringify(data));
            } catch (error) {
                console.log(error);
            }

            this.saveableCanvas.clear();

            if(this.state.batchcount >= 5)
            {
                this.props.onFinished();
            }

            this.setState((state) => ({
                batchcount: state.batchcount + 1
            }));
        }
    }

    render() {

        if (!this.props.wsData) {
            return (<h1>Ufff No Data</h1>);
        }

        return (
            <div className="draw">
                <div className="top">
                    <p className="instruction-paragraph">{this.state.hinttext}</p>
                    <div className="btns-timer">
                        <div onClick={this.onButtonNext}><img className='button' src={'next_icon.svg'} role='button' alt=''></img></div>
                        <div onClick={() => {
                        try {
                            this.saveableCanvas.undo();
                        } catch (e) {
                            return
                        }}}><img className='button' src={'undo_icon.svg'}  role='button' alt=''></img></div>

                        <CountDownTimer Secs={20} onTimeIsOver={this.onButtonNext} className="timer" onreset={this.state.resetTimer} ref={this.timerRef}/>
                    </div>
                </div>

                <div className='canvasSizePlaceholder'></div>

                <div className="canvas">
                    {this.state.unmountDrawing ? null : <CanvasDraw ref={canvasDraw => (this.saveableCanvas = canvasDraw)} brushColor="#000000" brushRadius={2} lazyRadius={0} //min is 300px by 300px even older 4:3 screens can resolve this(i hope)
                        canvasWidth={this.state.canvWidth} canvasHeight={this.state.canvHeight}
                        imgSrc={this.state.backgroundpic}/>}
                </div>

                <div className="hint-div">
                    <img src={this.state.hintpicture}
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

export default Draw;