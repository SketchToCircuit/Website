import React from 'react';
import ReactDOM from "react-dom";
import '../Styles/Draw.css';
import CanvasDraw from "react-canvas-draw";
ReactDOM.render(
<CanvasDraw/>, document.getElementById("root"));

class Draw extends React.Component {
    // Access websocket here with "this.props.ws" or if you need it more often:
    // "const {ws} = this.props" und dann mit "ws."

    constructor(props) {
        super(props)

        this.state = {
            img_blob: '', // BLOB Url of image; change state only with setState
        };
    }

    render() {
        var pic = localStorage.getItem('firstDrawing')
        console.log();
        return (
            <div>
            <div className='draw'>
                <CanvasDraw
                    className="canvas-one"
                    ref={canvasDraw => (this.saveableCanvas = canvasDraw)}
                    brushColor="#000000"
                    brushRadius="2"
                    lazyRadius="0"
                    //min is 300px by 300px even older 4:3 screens can resolve this(i hope)
                    canvasWidth={Math.max(300, window.innerHeight * 0.8)}
                    canvasHeight={Math.max(300, window.innerHeight * 0.8)}
                    //bs if somebody looks at it
                    imgSrc={localStorage.getItem('firstDrawing')}
                    />
            </div>
                <button className="next-btn"
                onClick={() => {
                    localStorage.setItem("firstDrawing", this.saveableCanvas.getSaveData());
                }}>
                    Save
                </button>
                <button className="undo-btn"
                    onClick={() => {this.saveableCanvas.undo();
                }}>
                    Undo
                </button>
            </div>
        );
    }
}

export default Draw;