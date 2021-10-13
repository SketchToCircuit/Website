import React from 'react';
import CanvasDraw from "react-canvas-draw";

import '../Styles/Draw.css';
class Draw extends React.Component {
    // Access websocket here with "this.props.ws" or if you need it more often:
    // "const {ws} = this.props" und dann mit "ws."

    constructor(props) {
        super(props)

        this.state = {
            isfirstDrawn: false,
            procedebtntext: "Next",
            backgroundpic: "logo512.png",
            canvdimension: window.innerHeight * 0.8
        };
    }

    prepareNext = () =>{
        var buffer = this.saveableCanvas.canvas.drawing.toDataURL("image/png");
        this.saveableCanvas.clear();
        //pfush because resize is neede (aba a guada Pfush)
        this.setState((state) => ({
            backgroundpic: buffer,
            procedebtntext: "Finish",
            canvdimension:  this.state.canvdimension + 1 }));
        this.setState((state) => ({
            canvdimension:  this.state.canvdimension - 1 }));
    }

    render() {
            return (
                <div>
                 <div className="draw-btn">
                    <button className="next-btn"
                    onClick={() => {
                        this.prepareNext();
                    }}>
                        {this.state.procedebtntext}
                    </button>
                    <button className="undo-btn"
                        onClick={() => {this.saveableCanvas.undo();
                    }}>
                        Undo
                    </button>
                    </div>
                    <CanvasDraw
                        id="mycanvas"
                        className="canvas-one"
                        ref={canvasDraw => (this.saveableCanvas = canvasDraw)}
                        brushColor="#000000"
                        brushRadius={2}
                        lazyRadius={0}
                        //min is 300px by 300px even older 4:3 screens can resolve this(i hope)
                        canvasWidth={this.state.canvdimension}
                        canvasHeight={this.state.canvdimension}
                        //bs if somebody looks at it
                        imgSrc={this.state.backgroundpic}
                        />
                </div>
            );    
    }
}

export default Draw;