import React from 'react';
import '../Styles/About.css';

class About extends React.Component {
    render() {

        return (
            <div className='about'>
                <h1>About Us</h1>
                <p>
                    We - Prof DI Rudolf Schamberger, Tim Brunner, Sebastian Pfusterer, Patrick Ziegler - are a small team from the higher technical college <a href="https://bulme.at/">HTL Bulme</a> interested in AI-Development.<br/>
                    This site is used to help us gather trainingsdata for our thesis: SketchToCircuit<br/>
                    The goal of SketchToCircuit is to easily convert sketches of electronic circuits to a format understandable by simulation and displaying software. We therefore hope to make the life of teachers and students easier by enabling them to use their sketches for further digital processing.
                </p>
            </div>
        );
    }
  }

export default About;