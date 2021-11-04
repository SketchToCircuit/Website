import React from 'react';
import '../Styles/Leaderboard.css';

class Leaderboard extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        if (this.props.data && this.props.data.scoreBoardData && this.props.data.scoreBoardData.length > 1) {

            let tableEntries = [];
            let i = 1;
            let onList = false;

            for (const user of this.props.data.scoreBoardData) {
                let mark = false;
                if (user.name === this.props.data.username) {
                    onList = true;
                    mark = true;
                }

                tableEntries.push(<tr className={mark ? "marked" : null}>
                    <td>{i++}.</td>
                    <td>{user.name}</td>
                    <td>{user.score}</td></tr>);
            }

            if (!onList) {
                tableEntries.push(<tr>
                    <td>...</td>
                    <td>...</td>
                    <td>...</td></tr>);

                tableEntries.push(<tr>
                    <td></td>
                    <td>{this.props.data.username}</td>
                    <td>{this.props.data.points}</td></tr>);
            }

            return (
            <div className='board'>
                <h1>Scoreboard</h1>
                <table>
                    <tr>
                        <th></th>
                        <th>Name</th>
                        <th>Points</th>
                    </tr>
                    {tableEntries}
                </table>
            </div>);
        } else {
            return (
            <div className='board'>
                <p>You are not logged in!</p>
                <p>Please return to the <a href='/'>mainpage</a> to login.</p>
            </div>);
        }
    }
  }

export default Leaderboard;