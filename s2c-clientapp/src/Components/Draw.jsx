import React from 'react';
import CanvasDraw from "react-canvas-draw";

import '../Styles/Draw.css';

var componentimage;
class Draw extends React.Component {
    // Access websocket here with "this.props.ws" or if you need it more often:
    // "const {ws} = this.props" und dann mit "ws."

    constructor(props) {
        super(props)

        this.state = {
            hintpicture: props.wsData.ComponentHint.img,
            hinttext: props.wsData.ComponentHint.text,
            isfirstDrawn: false,
            procedebtntext: "Next",
            backgroundpic: "",
            canvdimension: window.innerHeight * 0.8,
            batchcount: 1,
            type: ""
        };
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.wsData !== this.props.wsData) {
            //backend isnt aloowed to send the same task twice
            this.setState({hintpicture: this.props.wsData.ComponentHint.img, 
                           hinttext: this.props.wsData.ComponentHint.text,
                           type: this.props.type });
        }

        console.log("Poinst===>" + this.saveableCanvas.points.length);
    }

    onButtonNext = () => {
        if (!this.state.isfirstDrawn) {
            componentimage = this.saveableCanvas.canvas.drawing.toDataURL("image/png");
            this.saveableCanvas.clear();
            // pfush because resize is needed to update canvas since it doesnt update (aba aguada Pfush)
            this.setState((state) => ({
                backgroundpic: componentimage,
                procedebtntext: "Finish",
                isfirstDrawn: true,
                hinttext: this.props.wsData.LabelHint.text,
                hintpicture: this.props.wsData.LabelHint.img,
                canvdimension: this.state.canvdimension + 1
            }));

        } else if (this.state.isfirstDrawn) {

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
                    "compontentImg": componentimage,
                    "labelImg": this.saveableCanvas.canvas.drawing.toDataURL("image/png")
                }
            }

            this.saveableCanvas.clear();

            try {
                this.props.ws.send(JSON.stringify(data));
            } catch (error) {
                return;
            }

            this.setState((state) => ({
                batchcount: state.batchcount + 1
            }));

            if(this.state.batchcount >= 5)
            {
                this.props.onFinished();
            }
        }
    }

    render() {
        
        if (!this.props.wsData) {
            return(
                     <h1>Ufff No Data</h1>
            );
        }

        return (
            <div className="wraping-div">
                <div className="draw-btn">
                    <button
                        className="next-btn"
                        onClick={() => {
                        this.onButtonNext();
                    }}>
                        {this.state.procedebtntext}
                    </button>
                    <button
                        className="undo-btn"
                        onClick={() => {
                        this.saveableCanvas.undo();
                    }}>
                        Undo
                    </button>
                </div>

                <div className="canvas">
                    <CanvasDraw ref={canvasDraw => (this.saveableCanvas = canvasDraw)} brushColor="#000000" brushRadius={2} lazyRadius={0} //min is 300px by 300px even older 4:3 screens can resolve this(i hope)
                        canvasWidth={this.state.canvdimension} canvasHeight={this.state.canvdimension} //bs if somebody looks at it
                        imgSrc={this.state.backgroundpic}/>
                        <progress id="file" value={this.saveableCanvas.points.length} max="100"> 32% </progress>
                </div>

                <div className="hint-div">
                    <p className="instruction-paragraph">Please Draw this {this.state.hinttext}</p>
                    <img
                        src={this.state.hintpicture}
                        className="hint-picture"
                        width={this.state.canvdimension * 0.8}
                        alt=''/>
                </div>

            </div>
        );
    }
}

export default Draw;