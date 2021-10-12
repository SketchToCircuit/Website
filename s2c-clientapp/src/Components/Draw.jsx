import React from 'react';
import ReactDOM from "react-dom";
import '../Styles/Draw.css';
import CanvasDraw from "react-canvas-draw";
ReactDOM.render(
<CanvasDraw/>, document.getElementById("root"));

class Draw extends React.Component {
    // Access websocket here with "this.props.ws" or if you need it more often:
    // "const {ws} = this.props" und dann mit "ws."

    state = {
        color: "#ffc600",
        width: 600,
        height: 600,
        brushRadius: 5,
        lazyRadius: 2,
        gridColor: "rgba(150,150,150,0.17)",
        hideGrid: false
    };

    constructor(props) {
        super(props)

        this.state = {
            img_blob: '', // BLOB Url of image; change state only with setState
        };
    }

    render() {
        return (
            <div className='draw'>
                <CanvasDraw
                    ref={canvasDraw => (this.saveableCanvas = canvasDraw)}
                    brushColor="#ffc600"
                    brushRadius="2"
                    lazyRadius="0"/>
                <button className="undo-btn"
                    onClick={() => {this.saveableCanvas.undo();}}>
                    Undo
                </button>
            </div>
        );
    }
}

export default Draw;