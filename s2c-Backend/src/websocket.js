const WS = require('ws');
const { env } = require('process');
const fs = require('fs');

function sendData(data, ws) { // Send Json data to User
    if (ws.readyState === WS.OPEN) {
        try {
            data = JSON.stringify(data);
        } catch (err) {
            console.log("Error while preparing data to send")
        }
        ws.send(data);
    }
}

function getUserData(ws, client, database) {
    //Get score from db
    let score = 10;
    const data = {
        "PacketId": 201,
        "Data": {
            "avatar": client.google.picture,
            "username": client.google.name,
            "points": score,
            "unique": Math.floor((Math.random() + 1) * 10000)
        }
    };

    sendData(data, ws);

    return true;
}

function decideIfDrawVal(ws, client, database, base64Helper) {
    if (client.drawVal) {
        return;
    }

    function sendDraw() {
        database.getDrawData(base64Helper, (drawData) => {
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
            client.drawVal = "draw";
        });
    }

    function sendVal() {
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
            client.drawVal = "val";
        });
    }

    database.decideDrawValFromDB(client.google.sub, sendDraw, sendVal);
}

function onImgReceive(dataIn, ws, client, database, base64Helper) {
    if (client.drawVal === "draw" && dataIn.count >= 1 && dataIn.count <= 5 && dataIn.count === client.count + 1) {
        storeDrawnImage(dataIn, client ,database, base64Helper);

        database.getDrawData(base64Helper,(drawData) => {
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
            client.count += 1;
        });
    }
}

function storeDrawnImage(data, client ,database, base64Helper) {
    let callback = function() {
        onTypeValid();
    }
    // Check if type is valid
    database.checkType(data.type, callback)

    onTypeValid = () => {
        if(!fs.existsSync(env.SAVEFOLDER + data.type + '/'))
        {
            fs.mkdirSync(env.SAVEFOLDER + data.type + '/');
        }
        if(!fs.existsSync(env.SAVEFOLDER + data.type + '_label' + '/'))
        {
            fs.mkdirSync(env.SAVEFOLDER + data.type + '_label' + '/');
        }
        // check already saved images and get highest file name number and use it as the filenmae for the next image
        fs.readdir(env.SAVEFOLDER + data.type + '/', (err, files) => {
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

    onFoundHighestNumber = async (number) => {
        let compPath = await base64Helper.saveBase64Image(data.componentImg, env.SAVEFOLDER + data.type + '/' + number);
        let labelPath = await base64Helper.saveBase64Image(data.labelImg, env.SAVEFOLDER + data.type + '_label' + '/' + number);
        database.storeImage(compPath, labelPath, client.google.sub, data.type);
    }
}

function onValReceive(dataIn, ws, client, database, base64Helper) {
    console.log(dataIn);
    if (client.drawVal === "val" && dataIn.count >= 1 && dataIn.count <= 5 && dataIn.count === client.count + 1) {
        database.setValidated(dataIn.imgId, dataIn.validated, client.google.sub);

        database.getValidationData(base64Helper, client.google.sub, function (valData) {
            let dataOut = {
                "PacketId": 203,
                "Data": {
                    "hintText": valData.hintText,
                    "hintImg": valData.hintImg,
                    "valImg": valData.valImg,
                    "imgId": valData.imgId,
                    "unique": Math.floor((Math.random() + 1) * 10000) // Pfusch, um im frontend bei zwei gleichen Validierungsaufgaben (gleiches Bild und gleicher Text) trotzdem zwischen unterschiedlichen Paketen zu unterscheiden, ohne im ws.on an die Child-Components eine weitere Variable zum state-change mitgeben zu müssen. Es ist pfusch, aber war die einfachste Möglichkeit im Backend des Problem vom Pfusti zu lösen :-)
                }
            };

            sendData(dataOut, ws);
            client.count += 1;
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