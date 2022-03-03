const WS = require('ws');
const { env } = require('process');
const fs = require('fs');

function sendData(data, ws) {//Check if websocket is open and send data in json format to user
    if (ws.readyState === WS.OPEN) {
        try {
            data = JSON.stringify(data);
        } catch (err) {
            console.log("Error while preparing data to send")
        }
        ws.send(data);
    }
}

function getUserData(ws, client, database) {//Returns userdata and scoreboard

    database.getUserScore(client.google.sub, processData)//Get userdata and return to processData callback

    function processData(userScore, scoreBoard)//Get data into json format and send it to user
    {
        let scoreBoardData = [];
        for(var i in scoreBoard)//Turn scoreboard into list (name, score)
        {
            scoreBoardData.push({name: scoreBoard[i].username, score: scoreBoard[i].score});
        }
        let data = {
            "PacketId": 201,
            "Data": {
                "avatar": client.google.picture,
                "username": client.google.name,
                "points": userScore,
                "scoreBoardData": scoreBoardData,
                "unique": Math.floor((Math.random() + 1) * 10000) //Send unique id to differentiate between images when 2 of the same are send
            }
        }
        sendData(data, ws);
    }
    return true;
}

function decideIfDrawVal(ws, client, database, base64Helper) {//Decide if user draws or validates
    if (client.drawVal) {//Return if already drawing or validating
        return;
    }

    function sendDraw() {//Send draw data to user
        database.getDrawData(client.lastDrawId, base64Helper, (drawData) => {
            let dataOut = {
                "PacketId": 202,
                "Data": {
                    "type": drawData.type,
    
                    "ComponentHint": {
                        "text": drawData.componentText,
                        "img":  drawData.componentImg
                    },
    
                    "LabelHint": {
                        "text": drawData.labelText,
                        "img": drawData.labelImg
                    },
    
                    "unique": Math.floor((Math.random() + 1) * 10000)
                }
            };
            sendData(dataOut, ws);
            //Add data to userobject
            client.drawVal = "draw";
            client.lastDrawId = drawData.id;
            client.drawCmpType = drawData.type;
        });
    }

    function sendVal() {//Send validation data to user
        database.getValidationData(base64Helper, client.google.sub, (valData) => {
            let dataOut = {
                "PacketId": 203,
                "Data": {
                    "hintText": valData.hintText,
                    "hintImg": valData.hintImg,
                    "valImg": valData.valImg,
                    "imgId": valData.imgId,
                    "unique": Math.floor((Math.random() + 1) * 10000)
                }
            };
            sendData(dataOut, ws);
            //Add data to userobject
            client.drawVal = "val";
            client.valImgId = valData.imgId;
        });
    }
    database.decideDrawValFromDB(client.google.sub, sendDraw, sendVal);//Get data from database and provide callbacks
}

function onImgReceive(dataIn, ws, client, database, base64Helper) {//Process received image data
    //Check if user is allowed to send images
    if (client.drawVal === "draw" && dataIn.type === client.drawCmpType && dataIn.count >= 1 && dataIn.count <= env.DRAWING_COUNT && dataIn.count === client.count + 1) {
        storeDrawnImage(dataIn, client ,database, base64Helper);
        database.addUserScore(client.google.sub, 10);
        database.getDrawData(client.lastDrawId, base64Helper, (drawData) => {
            let dataOut = {
                "PacketId": 202,
                "Data": {
                    "type": drawData.type,
    
                    "ComponentHint": {
                        "text": drawData.componentText,
                        "img":  drawData.componentImg
                    },
    
                    "LabelHint": {
                        "text": drawData.labelText,
                        "img": drawData.labelImg
                    },
    
                    "unique": Math.floor((Math.random() + 1) * 10000) //Send unique id to differentiate between images when 2 of the same are send
                }
            };

            sendData(dataOut, ws);
            //Add data to userobject
            client.count += 1;
            client.lastDrawId = drawData.id;
            client.drawCmpType = drawData.type;
        });
    }
}

function storeDrawnImage(data, client ,database, base64Helper) {//Save received image to disk
    let callback = function() {
        onTypeValid();
    }
    // Check if type is valid
    database.checkType(data.type, callback)

    onTypeValid = () => {
        //Check if component folder existed and creates them if necessary
        if(!fs.existsSync(env.SAVEFOLDER + data.type + '/'))
        {
            fs.mkdirSync(env.SAVEFOLDER + data.type + '/');
        }
        if(!fs.existsSync(env.SAVEFOLDER + data.type + '_label' + '/'))
        {
            fs.mkdirSync(env.SAVEFOLDER + data.type + '_label' + '/');
        }

        fs.readdir(env.SAVEFOLDER + data.type + '/', (err, files) => {//Check already saved images and gets highest number
            if (!err) {
                let highestId = -1;
                for (let i = 0; i < files.length; i++) {
                    let matches = files[i].match(/([0-9]+)/);

                    if (matches.length >= 1) {
                        let number = parseInt(matches[0]);

                        if (number > highestId) {
                            highestId = number;
                        }
                    }
                }
                onFoundHighestNumber(highestId + 1);
            } else {
                console.log(err);
            }
        });
    }

    onFoundHighestNumber = async (number) => {//Save file to disk and database
        let compPath = await base64Helper.saveBase64Image(data.componentImg, env.SAVEFOLDER + data.type + '/' + number);
        let labelPath = await base64Helper.saveBase64Image(data.labelImg, env.SAVEFOLDER + data.type + '_label' + '/' + number);
        database.storeImage(compPath, labelPath, client.google.sub, data.type);
    }
}

function onValReceive(dataIn, ws, client, database, base64Helper) {//Process received validation data
    //Check if user is allowed to validate
    if (client.drawVal === "val" && dataIn.imgId === client.valImgId && dataIn.count >= 1 && dataIn.count <= env.VALIDATING_COUNT && dataIn.count === client.count + 1) {
        database.setValidated(dataIn.imgId, dataIn.validated, client.google.sub);

        const points = Math.ceil(15.0 / env.MAX_VALIDATION_RUNS);
        database.addUserScore(client.google.sub, points);
        database.addUserScoreFromImgId(dataIn.imgId, dataIn.validated ? points : -points);

        database.getValidationData(base64Helper, client.google.sub, function (valData) {
            let dataOut = {
                "PacketId": 203,
                "Data": {
                    "hintText": valData.hintText,
                    "hintImg": valData.hintImg,
                    "valImg": valData.valImg,
                    "imgId": valData.imgId,
                    "unique": Math.floor((Math.random() + 1) * 10000) //Send unique id to differentiate between images when 2 of the same are send
                }
            };

            sendData(dataOut, ws);
            client.count += 1;
            client.valImgId = valData.imgId;
        });
    }
}

module.exports = {
    sendData,
    getUserData,
    decideIfDrawVal,
    onImgReceive,
    storeDrawnImage,
    onValReceive
}