import React, {createRef} from 'react';
import CanvasDraw from "react-canvas-draw";

import CountDownTimer from './Timer';
import '../Styles/Draw.css';

class Draw extends React.Component {
    componentimage = null;

    constructor(props) {
        super(props)

        this.timerRef = createRef();

        this.state = {
            hintpicture: props.wsData.ComponentHint.img,
            hinttext: props.wsData.ComponentHint.text,
            isfirstDrawn: false,
            procedebtntext: "Next",
            backgroundpic: "",
            canvHeight: 0,
            canvWidth: 0,
            batchcount: 1,
            type: props.wsData.type
        };
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleResize, true)

        this.setState({
            canvHeight: document.getElementsByClassName('canvasSizePlaceholder')[0].clientHeight,
            canvWidth: window.innerWidth,
        });
    }
      
    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }
    
    handleResize = () => {
        this.setState({
            canvHeight: document.getElementsByClassName('canvasSizePlaceholder')[0].clientHeight,
            canvWidth: window.innerWidth,
        });
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.wsData !== this.props.wsData) {
            this.setState({hintpicture: this.props.wsData.ComponentHint.img, 
                           hinttext: this.props.wsData.ComponentHint.text,
                           type: this.props.wsData.type });
        }
    }

    onButtonNext = () => {
        this.timerRef.current.reset();
        if (!this.state.isfirstDrawn) {
            this.componentimage = this.saveableCanvas.canvas.drawing.toDataURL("image/png");
            this.saveableCanvas.clear();
            // pfush because resize is needed to update canvas since it doesnt update (aba aguada Pfush)
            this.setState((state) => ({
                backgroundpic: this.componentimage,
                procedebtntext: "Finish",
                isfirstDrawn: true,
                hinttext: this.props.wsData.LabelHint.text,
                hintpicture: this.props.wsData.LabelHint.img,
                canvHeight: state.canvHeight + 1
            }));

            this.setState((state) => ({
                canvHeight: state.canvHeight - 1
            }));
            
        } else {

            this.setState((state) => ({
                backgroundpic: "",
                procedebtntext: "Next",
                isfirstDrawn: false,
                canvHeight: state.canvHeight + 1
            }));

            this.setState((state) => ({
                canvHeight: state.canvHeight - 1
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
                    <div className="btns-timer">
                        <img className='button' src={'next_icon.svg'} onClick={this.onButtonNext} role='button'></img>
                        <img className='button' src={'undo_icon.svg'} onClick={() => {
                        try {
                            this.saveableCanvas.undo();
                        } catch (e) {
                            return
                        }}} role='button'></img>

                        <CountDownTimer Secs={10} onTimeIsOver={this.onButtonNext} className="timer" onreset={this.state.resetTimer} ref={this.timerRef}/>
                    </div>
                    <p className="instruction-paragraph">{this.state.hinttext}</p>
                </div>

                <div className='canvasSizePlaceholder'></div>

                <div className="canvas">
                    <CanvasDraw ref={canvasDraw => (this.saveableCanvas = canvasDraw)} brushColor="#000000" brushRadius={2} lazyRadius={0} //min is 300px by 300px even older 4:3 screens can resolve this(i hope)
                        canvasWidth={this.state.canvWidth} canvasHeight={this.state.canvHeight}
                        imgSrc={this.state.backgroundpic}/>
                </div>

                <div className="hint-div">
                    <img
                        src={this.state.hintpicture}
                        className="hint-picture"
                        alt=''/>
                </div>
            </div>
        );
    }
}

export default Draw;