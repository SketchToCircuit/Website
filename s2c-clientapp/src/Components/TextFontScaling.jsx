import React from 'react';


class TextFontScaling extends React.Component {
    constructor(props) {
        super(props);

        this.id = '_text_font_scaling_' + String(Math.floor((Math.random() * 9 + 1) * 10000))

        this.state = {
            fontSize: props.maxFontSize,
            invisible: true
        };
    }

    componentDidMount() {
        this.adjustSize();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps !== this.props) {
            this.setState({
                fontSize: this.props.maxFontSize,
                invisible: true
            });
        }
        this.adjustSize();
    }

    adjustSize = () => {
        const span = document.getElementById(this.id);
        if (span.offsetHeight > span.parentElement.offsetHeight) {
            this.setState((state) => ({
                fontSize: state.fontSize - 1
            }));
        } else if (this.state.invisible) {
            this.setState({
                invisible: false
            });
        }
    }

    render() {
        let style = {
            "fontSize": String(this.state.fontSize) + "px",
        }

        if (this.state.invisible) {
            style.opacity = 0;
        } else {
            style.opacity = 1;
        }

        return (<span style={style} id={this.id}>{this.props.text}</span>);
    }
}

export default TextFontScaling;