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
            canvdimension: window.innerWidth ,
            batchcount: 1,
            type: props.wsData.type
        };
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
                canvdimension: this.state.canvdimension + 1
            }));
            
        } else {

            this.setState((state) => ({
                backgroundpic: "",
                procedebtntext: "Next",
                isfirstDrawn: false,
                canvdimension: this.state.canvdimension + 1
            }));

            this.setState((state) => ({
                canvdimension: this.state.canvdimension - 1
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
            return(
                     <h1>Ufff No Data</h1>
            );
        }

        return (
            <div className="draw">
                <div className="top">
                    <div className="btns-timer">
                        <button
                            className="next-btn"
                            onClick={() => {
                            this.onButtonNext();
                        }}> {this.state.procedebtntext} </button>

                        <button
                            className="undo-btn"
                            onClick={() => {
                            this.saveableCanvas.undo();
                        }}> Undo </button>
                        
                        <CountDownTimer Secs={10} onTimeIsOver={this.onButtonNext} className="timer" onreset={this.state.resetTimer} ref={this.timerRef}/>
                    </div>
                    <p className="instruction-paragraph">{this.state.hinttext}</p>
                </div>

                <div className="canvas">
                    <CanvasDraw ref={canvasDraw => (this.saveableCanvas = canvasDraw)} brushColor="#000000" brushRadius={2} lazyRadius={0} //min is 300px by 300px even older 4:3 screens can resolve this(i hope)
                        canvasWidth={this.state.canvdimension} canvasHeight={this.state.canvdimension}
                        imgSrc={this.state.backgroundpic}/>

                <div className="hint-div">
                    <img
                        src={this.state.hintpicture}
                        className="hint-picture"
                        width={this.state.canvdimension * 0.1}
                        alt=''/>
                </div>

                </div>


            </div>
        );
    }
}

export default Draw;