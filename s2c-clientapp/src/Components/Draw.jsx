import React, {createRef} from 'react';
import CanvasDraw from "react-canvas-draw";

import CountDownTimer from './Timer';
import TextFontScaling from './TextFontScaling';

import '../Styles/Draw.css';

import Jimp from 'jimp/es';
import { autocrop } from '../utils/autocrop';

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
    
    autocropImages = async (rawvaluepicture, rawcomponentpicture, resolution) => {
       //strip the beginning /^data:image\/([A-Za-z]+);base64,(.+)$/ of the picure
       let valuePicmatches = rawvaluepicture.match(/^data:image\/([A-Za-z]+);base64,(.+)$/);
       let componentPicmatches = rawcomponentpicture.match(/^data:image\/([A-Za-z]+);base64,(.+)$/);

        if (valuePicmatches.length !== 3 || componentPicmatches.length !== 3) {
            return;
        }

        let valuePic = await Jimp.read(Buffer.from(valuePicmatches[2], 'base64'))
        let componentPic = await Jimp.read(Buffer.from(componentPicmatches[2], 'base64'))

        const cropAreaValue = autocrop(valuePic);
        const cropAreaComponent = autocrop(componentPic);

        if (!cropAreaValue || !cropAreaComponent) {
            const tinyWhiteImg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEBLAEsAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhADEAAAAVSf/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABCf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=';

            return {valuePicture: tinyWhiteImg, componentPicture: tinyWhiteImg};
        }

        const newX = Math.min(cropAreaValue.x, cropAreaComponent.x);
        const newY = Math.min(cropAreaValue.y, cropAreaComponent.y);
        const newW = Math.max(cropAreaValue.x + cropAreaValue.w, cropAreaComponent.x + cropAreaComponent.w) - newX;
        const newH = Math.max(cropAreaValue.y + cropAreaValue.h, cropAreaComponent.y + cropAreaComponent.h) - newY;

        const scaleFactor = resolution / Math.max(newW, newH);
        valuePic.scale(scaleFactor);
        componentPic.scale(scaleFactor);

        let offValueX = 0;
        let offValueY = 0;
        let offComponentX = 0;
        let offComponentY = 0;

        if (newH < newW) {
            // center on y
            const centerOff = (resolution - newH * scaleFactor) / 2.0;
            offValueX = (cropAreaValue.x - newX) * scaleFactor;
            offValueY = (cropAreaValue.y - newY) * scaleFactor + centerOff;
            offComponentX = (cropAreaComponent.x - newX) * scaleFactor;
            offComponentY = (cropAreaComponent.y - newY) * scaleFactor + centerOff;
        } else {
            // center on x
            const centerOff = (resolution - newW * scaleFactor) / 2.0;
            offValueX = (cropAreaValue.x - newX) * scaleFactor + centerOff;
            offValueY = (cropAreaValue.y - newY) * scaleFactor;
            offComponentX = (cropAreaComponent.x - newX) * scaleFactor + centerOff;
            offComponentY = (cropAreaComponent.y - newY) * scaleFactor;
        }

        let finalValuePic = new Jimp(resolution, resolution, '#FFFFFF');
        let finalComponentPic = new Jimp(resolution, resolution, '#FFFFFF');

        finalValuePic.composite(valuePic, offValueX, offValueY, {mode: Jimp.BLEND_DARKEN});
        finalComponentPic.composite(componentPic, offComponentX, offComponentY, {mode: Jimp.BLEND_DARKEN});

        return {valuePicture: await finalValuePic.getBase64Async(Jimp.AUTO), componentPicture: await finalComponentPic.getBase64Async(Jimp.AUTO)};
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
            this.timerRef.current.reset(100);

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
            this.timerRef.current.reset(100);

            this.setState({
                backgroundpic: "",
                isfirstDrawn: false,
                unmountDrawing: true,
                hinttext: "",
                hintpicture: ""
            });  

            this.autocropImages(this.saveableCanvas.canvas.drawing.toDataURL("image/png"), this.componentimage, 400).then((images) => {
                const data = {
                    "PacketId": 104,
                    "Data": {
                        "count": this.state.batchcount,
                        "type": this.state.type,
                        "componentImg": images.componentPicture,
                        "labelImg": images.valuePicture
                    }
                }

                console.log(data);

                try {
                    this.props.ws.send(JSON.stringify(data));
                } catch (error) {
                    console.error(error);
                }
            }).catch((err) => {
                console.error(err);
            });

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
                        <div><img className='button' src={'next_icon.svg'} role='button' alt='' onClick={this.onButtonNext}></img></div>
                        <div><img className='button' src={'undo_icon.svg'}  role='button' alt='' onClick={() => {
                        try {
                            this.saveableCanvas.undo();
                        } catch (e) {
                            return
                        }}}></img></div>

                        <CountDownTimer Secs={100} onTimeIsOver={this.onButtonNext} className="timer" onreset={this.state.resetTimer} ref={this.timerRef}/>
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