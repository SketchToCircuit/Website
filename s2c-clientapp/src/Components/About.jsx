import React from 'react';
import '../Styles/About.css';

class About extends React.Component {

    componentDidMount() {
        this.props.setShowNav(true);
    }

    render() {
        const aboutText = "\
        We - Tim Brunner, Sebastian Pfusterer, Patrick Ziegler - are a small team interested in AI-Development.\r\n\
        This site is used to help us gather trainingsdata for our thesis: SketchToCircuit\r\n\
        The goal of SketchToCircuit is to easily convert sketches of electronic circuits to a format understandable by simulation software and are easy to render.";

        return (
            <div className='about'>
                <h1>About Us</h1>
                <p>{aboutText}</p>
            </div>
        );
    }
  }

export default About;