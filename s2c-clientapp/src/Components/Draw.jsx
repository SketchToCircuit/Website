import React, {createRef} from 'react';
import CanvasDraw from "react-canvas-draw";

import CountDownTimer from './Timer';
import TextFontScaling from './TextFontScaling';

import '../Styles/Draw.css';

class Draw extends React.Component {
    componentimage = null;

    constructor(props) {
        super(props)

        this.timerRef = createRef();
        this.forceResize = false;
        this.countDownTime = 30;

        // set custom vh/vw-unit for mobile devices
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        let vw = window.innerWidth * 0.01;
        document.documentElement.style.setProperty('--vw', `${vw}px`);

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
        this.resizeObserver = new ResizeObserver(this.handleResize);
        this.resizeObserver.observe(document.getElementById('canvasSizePlaceholder'));

        window.addEventListener('resize', this.onWindowResize);

        this.setState({
            canvHeight: document.getElementById('canvasSizePlaceholder').offsetHeight,
            canvWidth: window.innerWidth,
        });
    }
      
    componentWillUnmount() {
        this.resizeObserver.disconnect();
        window.removeEventListener('resize', this.onWindowResize);
    }
    
    onWindowResize = () => {
        // set custom vh/vw-unit for mobile devices
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        let vw = window.innerWidth * 0.01;
        document.documentElement.style.setProperty('--vw', `${vw}px`);
    }

    handleResize = () => {
        // Force canvas size to stay the same during one drawing process
        if (!this.state.isfirstDrawn) {
            this.setState({
                canvHeight: document.getElementById('canvasSizePlaceholder').offsetHeight,
                canvWidth: document.getElementById('canvasSizePlaceholder').offsetWidth,
            });
        }
    }

    componentDidUpdate(prevProps, prevState) {
        const topHeight = document.getElementById("top").offsetHeight;
        document.documentElement.style.setProperty('--top-h', `${topHeight}px`);

        if (prevState.isfirstDrawn && !this.state.isfirstDrawn) {
            this.handleResize();
        }

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
        if (!this.state.isfirstDrawn) {
            this.timerRef.current.reset(15);

            this.componentimage = this.saveableCanvas.canvas.drawing.toDataURL("image/png");
            this.saveableCanvas.clear();
            this.setState({
                backgroundpic: this.componentimage,
                isfirstDrawn: true,
                hinttext: this.props.wsData.LabelHint.text,
                hintpicture: this.props.wsData.LabelHint.img,
                unmountDrawing: true
            });

        } else {
            this.timerRef.current.reset(30);

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
                console.error(error);
            }

            this.saveableCanvas.clear();

            if(this.state.batchcount >= 5)
            {
                this.props.onFinished();
            }

            this.setState((state) => ({
                backgroundpic: "",
                isfirstDrawn: false,
                unmountDrawing: true,
                hinttext: "",
                hintpicture: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",      // Tiniest valid gif
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
                <div className="top" id="top">
                    <div className="instruction-paragraph"><TextFontScaling text={this.state.hinttext} maxFontSize={20}/></div>
                    <div className="btns-timer">
                        <span className='counter'>{this.state.batchcount}/5</span>
                        <div onClick={this.onButtonNext}><img className='button' src={'next_icon.svg'} role='button' alt=''></img></div>
                        <div onClick={() => {
                        try {
                            this.saveableCanvas.undo();
                        } catch (e) {
                            return
                        }}}><img className='button' src={'undo_icon.svg'}  role='button' alt=''></img></div>

                        <CountDownTimer Secs={30} onTimeIsOver={this.onButtonNext} className="timer" onreset={this.state.resetTimer} ref={this.timerRef}/>
                    </div>
                </div>

                <div id='canvasSizePlaceholder'></div>

                <div className="canvas">
                    {this.state.unmountDrawing ? null : <CanvasDraw ref={canvasDraw => (this.saveableCanvas = canvasDraw)} brushColor="#000000" brushRadius={2} lazyRadius={0}
                        canvasWidth={this.state.canvWidth} canvasHeight={this.state.canvHeight}
                        imgSrc={this.state.backgroundpic}/>}
                </div>

                <div className="hint-div" id="hint-div" role='button' large='0'
                        onClick={() => {
                            if (document.getElementById('hint-div').getAttribute('large') === '1') {
                                document.getElementById('hint-div').setAttribute('large', '0')
                            } else {
                                document.getElementById('hint-div').setAttribute('large', '1')
                            }}}>
                    <span>Example</span>
                    <img src={this.state.hintpicture}
                        className="hint-picture"
                        alt=''/>
                </div>
            </div>
        );
    }
}

export default Draw;