import React, {createRef} from 'react';
import CanvasDraw from "react-canvas-draw";

import CountDownTimer from './Timer';
import TextFontScaling from './TextFontScaling';

import '../Styles/Draw.css';

import Jimp from 'jimp';


class Draw extends React.Component {
    componentimage = null;

    constructor(props) {
        super(props)

        //Prototype for jimp to get the crop dimensions + Cordinates        
        Jimp.prototype.__crop = Jimp.prototype.crop
        Jimp.prototype.crop = function (x, y, w, h, cb) {  
        this.cropArea = { x, y, w, h }
        return this.__crop(x, y, w, h, cb)
        }

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
    
    resizedrawn = async (rawvaluepicture, rawcomponentpicture) =>{
       //strip the beginning /^data:image\/([A-Za-z]+);base64,(.+)$/ of the picure
       let valuePicmatches = rawvaluepicture.match(/^data:image\/([A-Za-z]+);base64,(.+)$/);
       let componentPicmatches = rawcomponentpicture.match(/^data:image\/([A-Za-z]+);base64,(.+)$/);

        if (valuePicmatches.length !== 3 && componentPicmatches.length !== 3) {
            return;
        }

        let valuePicture = await Jimp.read(Buffer.from(valuePicmatches[2], 'base64'))
        let componentPicture = await Jimp.read(Buffer.from(componentPicmatches[2], 'base64'))

        let valPicOffsets;
        let comPicOffsets;

        await valuePicture.autocrop(0, (error, valuePicture) => {    
            valPicOffsets = valuePicture.cropArea; // cropArea = { x, y, w, h }
          })
        await componentPicture.autocrop(0, (error, componentPicture) => {    
           comPicOffsets = componentPicture.cropArea; // cropArea = { x, y, w, h }
          })
        
        let unscaledwidth;
        let unscaledheight;

        let boundingboxX;
        let boundingboxY;

        const resolution = 512;

        //get unscaled  width of Combined Bounding Box  
        if(valPicOffsets.w < comPicOffsets.w)
        {
            if(Math.abs(valPicOffsets.x - comPicOffsets.x) + valPicOffsets.w > comPicOffsets.w)
            {
                if(valPicOffsets.x < comPicOffsets.x)
                {
                //if the Value is outward to the left add componentlength
                unscaledwidth = Math.abs(valPicOffsets.x - comPicOffsets.x) + comPicOffsets.w;
                boundingboxX = valPicOffsets.x;
                }
                else
                {
                //if the Value is outward to the right add valuelength
                  unscaledwidth = Math.abs(valPicOffsets.x - comPicOffsets.x) + valPicOffsets.w;
                  boundingboxX = comPicOffsets.x;
                }
            }
            else
            {
                unscaledwidth = comPicOffsets.w;
                boundingboxX = comPicOffsets.x;
            }
        }
        else
        {
            //a lot of nearly redunden code but patrick said i should include the edge case that if the label is bigger than the component that it schould scale properly
            //i think every picture that has a bigger value than component has a 99.9 percent chance of being garbage but hey
            if(Math.abs(valPicOffsets.x - comPicOffsets.x) + valPicOffsets.w > valPicOffsets.w)
            {
                if(valPicOffsets.x < comPicOffsets.x)
                {
                //if the Component is outward to the left add componentlength 
                unscaledwidth = Math.abs(valPicOffsets.x - comPicOffsets.x) + valPicOffsets.w;
                boundingboxX = comPicOffsets.x;
                }
                else
                {
                //if the component is outward to the right add valuelength
                  unscaledwidth = Math.abs(valPicOffsets.x - comPicOffsets.x) + comPicOffsets.w;
                  boundingboxX = valPicOffsets.x;
                }
            }
            else
            {
                unscaledwidth = valPicOffsets.w;
                boundingboxX = valPicOffsets.x;
            }
        }


        //Get unscaled  height of combined bounding box
        if(valPicOffsets.h < comPicOffsets.h)
        {
            if(Math.abs(valPicOffsets.y - comPicOffsets.y) + valPicOffsets.h > comPicOffsets.h)
            {
                if(valPicOffsets.y < comPicOffsets.y)
                {
                //if the Value is uppward to the left add componentlength
                unscaledheight = Math.abs(valPicOffsets.y - comPicOffsets.y) + comPicOffsets.h;
                boundingboxY = valPicOffsets.y;
                }
                else
                {
                //if the Value is downward add valuelength
                  unscaledheight = Math.abs(valPicOffsets.y - comPicOffsets.y) + valPicOffsets.h;
                  boundingboxY = comPicOffsets.y;
                }
            }
            else
            {
                unscaledheight = comPicOffsets.h;
                boundingboxY = valPicOffsets.y;
            }
        }
        else
        {
            //here it makes a lot of sence since componets somtimes are not ass high than values/labels
            if(Math.abs(valPicOffsets.y - comPicOffsets.y) + valPicOffsets.h > valPicOffsets.h)
            {
                if(valPicOffsets.y < comPicOffsets.y)
                {
                //if the Value is outward to the left add componentlength
                unscaledheight = Math.abs(valPicOffsets.y - comPicOffsets.y) + valPicOffsets.h;
                boundingboxX = comPicOffsets.y;
                }
                else
                {
                //if the Value is outward to the right add valuelength
                unscaledheight = Math.abs(valPicOffsets.y - comPicOffsets.y) + comPicOffsets.h;
                boundingboxX = valPicOffsets.y;
                }
            }
            else
            {
                unscaledheight = valPicOffsets.h;
                boundingboxY = valPicOffsets.y
            }
        }        
        //To Do patrick will das Mitelpunk, mitelpunkt von Combined Bounding box ist

        //reference image.resize( w, h);

        //Check which side to scale
        let scalefactorWidth;
        let scalefactorHeight;

        //Ahhhhhhhhhhhhhh made a Fucky wucky
        //resize component pic
        scalefactorWidth =  comPicOffsets.w / unscaledwidth;
        scalefactorHeight = comPicOffsets.h / unscaledheight;
        componentPicture.resize( scalefactorWidth * resolution, scalefactorHeight * resolution);

        //resize value pic
        scalefactorWidth =  valPicOffsets.w / unscaledwidth;
        scalefactorHeight = valPicOffsets.h / unscaledheight;
        valuePicture.resize( scalefactorWidth * resolution, scalefactorHeight * resolution);
        
        let blankimage =  new Jimp(resolution, resolution, '#FFFFFF');
        componentPicture = await blankimage.composite(componentPicture, boundingboxX - comPicOffsets.x, boundingboxY - comPicOffsets.y);

        blankimage =  new Jimp(resolution, resolution, '#FFFFFF');
        valuePicture = await blankimage.composite(valuePicture, boundingboxX - valPicOffsets.x, boundingboxY - valPicOffsets.y);  

        let Images = {
            "value": await valuePicture.getBase64Async(Jimp.AUTO),
            "component":await componentPicture.getBase64Async(Jimp.AUTO)
        }
        return Images;
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

            if(this.state.batchcount >= process.env.DRAWING_COUNT)
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

        console.log(process.env);

        return (
            <div className="draw">
                <div className="top" id="top">
                    <div className="instruction-paragraph"><TextFontScaling text={this.state.hinttext} maxFontSize={20}/></div>
                    <div className="btns-timer">
                        <span className='counter'>{this.state.batchcount}/{process.env.DRAWING_COUNT}</span>
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