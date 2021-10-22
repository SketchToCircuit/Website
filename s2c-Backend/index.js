const WS = require('ws');
const fs = require('fs');
const http = require('http');
const path = require('path');
const {OAuth2Client} = require('google-auth-library');
const mysql = require('mysql');
const Jimp = require('jimp');
const util = require('util');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'setup.cfg')));

const o2Client = new OAuth2Client(config.serverSettings.o2Id);

let database = mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
});
  
database.connect(function(err) {
    if (err) {
        console.log("DB-Error: " + err);
        return;
    }

    console.log("Connected to database!");
});

let server = http.createServer((req, res) => {
    res.writeHead(401);
    res.end("Websocket EndPoint\n");
}).listen(config.serverSettings.backendPort); //Create Http Server

let count = 1;
const wss = new WS.Server({server}); //Create WebSocketServer with the Http server
const clients = new Map(); //Map to store ws instances

function getUniqueId(count) {
    return (Math.floor((Math.random() + 1) * 10000) * 10 + count);
}

async function getBase64Img(relPath) {
    try {
        let absPath = path.join(__dirname, relPath);
        let img = await Jimp.read(path.join(__dirname, relPath));
        let ext = absPath.split('.').pop().toLowerCase();
        if (ext === 'jpg') {
            ext = 'jpeg';
        }
        return 'data:image/'+ ext +';base64,' + await img.getBase64Async(Jimp.AUTO);
    } catch (error) {
        console.log(error);
        return '';
    }
}

async function getCombinedBase64Img(pathA, pathB) {
    try {
        let imgA = await Jimp.read(path.join(__dirname, pathA));
        let imgB = await Jimp.read(path.join(__dirname, pathB));
        imgA.composite(imgB, 0, 0, {
            mode: Jimp.BLEND_DARKEN
        });
        let result = await imgA.getBase64Async(Jimp.AUTO);
        return result;   
    } catch (e) {
        console.log(e);
        return '';
    }
}

// store image at relative path (<path> doesn't need an extension)
async function saveBase64Image(dataString, relPath) {
    try {
        let matches = dataString.match(/^data:image\/([A-Za-z]+);base64,(.+)$/);
        if (matches.length !== 3) {
            return;
        }
        relPath += '.' + matches[1];
        await util.promisify(fs.writeFile)(path.join(__dirname, relPath), Buffer.from(matches[2], 'base64'), );
        return relPath
    } catch (e) {
        console.log(e);
        return '';
    }
}

wss.on('connection', function connection(ws, req) {
    ws.ping()

    const id = getUniqueId(count);
    count += 1;

    console.log(`Connection from ${req.socket.remoteAddress} with id ${id}`);
    let userObject = new UserObject(id);

    clients.set(ws, userObject);

    ws.on('message', function incoming(data) {
        let success = false;

        try {
            success = PacketHandler(data, ws);
        } catch (error) {
            success = false;
        }
        
        if (!success) {
            console.log(`Couldn't handle data: ${JSON.stringify(JSON.parse(data))}`);
        }
    });

    ws.on('close', () => {
        console.log(`Closed connection with id ${clients.get(ws).id}`);
        clients.delete(ws);
    })
});

// add googleId to database
function dbAddUser(googleId) {
    let query = "SELECT * FROM google_user WHERE google_id = ?;";
    database.query(query, [googleId], (err, result) => {
        if (err) {
            console.log(err);
        }

        if (!err && result && !result.length) {
            query = "INSERT INTO google_user(google_id, untrusted) VALUES(?, FALSE);";
            database.query(query, [googleId], (err, result) => {
                if (err) {
                    console.log(err);
                }
            })
        }
    });
}

// get data for validation from database and filesystem
function getValidationData(callback) {
    // order by random number to select random image
    // (RAND() + 1) * ( ) -> already validated images will always have a higher "sorting number" -> only taken if no others are left
    let query = "SELECT * FROM images, component_types WHERE component_type = component_id ORDER BY ((RAND() + 1) * (looked_at + 1)) LIMIT 1;";

    database.query(query, (err, result) => {
        if (err) {
            console.log(err);
        } else if (result.length >= 1) {
            async function combineData(r) {
                let valData = new Object();
                valData.hintText = r.val_hint;
                valData.hintImg = await getBase64Img(r.hint_img);
                valData.valImg = await getCombinedBase64Img(r.component_path, r.label_path);
                valData.imgId = r.image_id;
                return valData;
            }

            combineData(result[0]).then((valData) => {callback(valData);});
        }
    });
}

// set the validation status of this img
function setValidated(imgId, validated, googleId) {
    let query = "UPDATE images SET validated = ?, validator_id = ?, looked_at = TRUE WHERE image_id = ?;";

    database.query(query, [validated, googleId, imgId], (err, result) => {
        if (err) {
            console.log(err);
        }
    });
}

function storeDrawnImage(data, client) {
    // Check if type is valid
    let query = "SELECT * FROM component_types WHERE file_prefix = ?;";
    database.query(query, [data.type], (err, result) => {
        if (err) {
            console.log(err);
        } else if (result.length >= 1) {
            onTypeValid();
        }
    });

    onTypeValid = () => {

        // TODO check if folder (config.components.saveFolder + data.type + '/') and (config.components.saveFolder + data.type + '_label' + '/') do exist. If necessary create them

        // check already saved images and get highest file name number and use it as the filenmae for the next image
        fs.readdir(config.components.saveFolder + data.type + '/', (err, files) => {
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
        let compPath = await saveBase64Image(data.componentImg, config.components.saveFolder + data.type + '/' + number);
        let labelPath = await saveBase64Image(data.labelImg, config.components.saveFolder + data.type + '_label' + '/' + number);

        // TODO
        // store data in database
        // insert into images, set values component_path, label_path (already in correct format in above variables), drawer_id to client.google.sub
    }
}

function PacketHandler(data, ws) {
    let client = clients.get(ws);

    try {
        data = JSON.parse(data);
    } catch {return false;}

    if (!data.PacketId) 
        return false;

    if (data.PacketId == 101 && client.isAuth != true) {
        if (!data.Data.token) 
            return false;

        verifyGoogleToken(data.Data.token).then((payload) => {
            client.google = payload;
            client.isAuth = true;

            // payload.sub is the googleId
            dbAddUser(payload.sub);
        }).catch((err) => {
            console.log(err);
            client.isAuth = false;
        });

        return true;
    }

    if (!clients.get(ws).isAuth) {
        console.log("User is unauthorized");
        return false;
    }     

    switch (data.PacketId) {
        case 102:
            getUserData(ws, client);
            break;
        case 103:
            decideIfDrawVal(ws, client);
            break;
        case 104:
            onImgReceive(data.Data, ws, client);
            break;
        case 105:
            onValReceive(data.Data, ws, client);
            break;
        default:
            return false;
    }

    return true;
}

function onValReceive(dataIn, ws, client) {
    if (client.drawVal === "val" && dataIn.count >= 1 && dataIn.count <= 5 && dataIn.count === client.count + 1) {
        setValidated(dataIn.imgId, dataIn.validated, client.google.sub);

        getValidationData(function(valData) {
            let dataOut = { "PacketId" : 203, "Data": {
                "hintText": valData.hintText,
                "hintImg": valData.hintImg,
                "valImg": valData.valImg,
                "imgId": valData.imgId,
                "unique": Math.floor((Math.random() + 1) * 10000)
            }};
        
            sendData(dataOut, ws);
            client.count += 1;
        });
    }
}

function onImgReceive(dataIn, ws, client) {
    if (client.drawVal === "draw" && dataIn.count >= 1 && dataIn.count <= 5 && dataIn.count === client.count + 1) {
        storeDrawnImage(dataIn);

        let dataOut = { "PacketId": 202,   "Data": {
            "type": "R_V",
        
            "ComponentHint": {
              "text": "Hint 1",
              "img": "logo192.png"
            },
        
            "LabelHint": {
              "text": "hint 2",
              "img": "logo192.png"
            },

            "unique": Math.floor((Math.random() + 1) * 10000)
          }
        };

        sendData(dataOut, ws);
        client.count += 1;
    }
}

function getUserData(ws, client) {
    //Database Access for User data <----------------
    let userScore = 16;
    console.log(client.google);

    const data = { "PacketId" : 201, "Data" : {
        "avatar" : client.google.picture,
        "username" : client.google.name,
        "points" : userScore,
        "unique": Math.floor((Math.random() + 1) * 10000)
    }};

    sendData(data, ws);

    return true;
}

function decideIfDrawVal(ws, client) {
    if (client.drawVal) {
        return;
    }

    if (Math.random() > 0.5) {
        let dataOut = { "PacketId": 202,   "Data": {
            "type": "R_V",
        
            "ComponentHint": {
              "text": "hint 3",
              "img": "logo192.png"
            },
        
            "LabelHint": {
              "text": "hint 4",
              "img": "logo192.png"
            },

            "unique": Math.floor((Math.random() + 1) * 10000)
        }};

        sendData(dataOut, ws);
        client.drawVal = "draw";
    } else {
        getValidationData(function(valData) {
            let dataOut = { "PacketId" : 203, "Data": {
                "hintText": valData.hintText,
                "hintImg": valData.hintImg,
                "valImg": valData.valImg,
                "imgId": valData.imgId,
                "unique": Math.floor((Math.random() + 1) * 10000)
            }};
        
            sendData(dataOut, ws);
            client.drawVal = "val";
        });
    }
}

function sendData(data, ws) { // Send Json data to User
    if (ws.readyState === WS.OPEN) {
        try
        {
            data = JSON.stringify(data);
        } catch (err) {
            console.log("Error while preparing data to send")
        }
        ws.send(data);
    }
}

async function verifyGoogleToken(token) { //Google verify token
    const ticket = await o2Client.verifyIdToken({idToken: token, audience: config.serverSettings.o2Id});
    const payload = ticket.getPayload();
    return payload;
}

class UserObject
{
    constructor(id) {
        this.id = id; //UserID this.
        this.isAuth = false; //Is user Authenticated this.
        this.google = undefined; //Google token this.
        this.drawVal = undefined; //val or draw or non
        this.count = 0; // How many images have been drawn/validated?
    }
}

console.log("Wss startet");
