const WS = require('ws');
const fs = require('fs');
const http = require('http');
const path = require('path');
const {OAuth2Client} = require('google-auth-library');
const mysql = require('mysql');
const Jimp = require('jimp');

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

function getBase64Img(relPath) {
    try {
        let img = fs.readFileSync(path.join(__dirname, relPath));
        return 'data:image/jpeg;base64,' + img.toString('base64');
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

wss.on('connection', function connection(ws, req) {
    ws.ping()

    const id = getUniqueId(count);
    count += 1;

    console.log(`Connection from ${req.socket.remoteAddress} with id ${id}`);
    var userObject = new UserObject(id);

    clients.set(ws, userObject);

    ws.on('message', function incoming(data) {
        var success = false;

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
    var query = "SELECT * FROM google_user WHERE google_id = ?;";
    database.query(query, [googleId], function(err, result) {
        if (err) {
            console.log(err);
        }

        if (!err && result && !result.length) {
            query = "INSERT INTO google_user(google_id, untrusted) VALUES(?, FALSE);";
            database.query(query, [googleId], function(err, result) {
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
    var query = "SELECT * FROM images, component_types WHERE component_type = component_id ORDER BY ((RAND() + 1) * (looked_at + 1)) LIMIT 1;";

    database.query(query, function(err, result) {
        if (err) {
            console.log(err);
        } else if (result.length >= 1) {
            async function combineData(r) {
                var valData = new Object();
                valData.hintText = r.val_hint;
                valData.hintImg = getBase64Img(r.hint_img);
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
    var query = "UPDATE images SET validated = ?, validator_id = ?, looked_at = TRUE WHERE image_id = ?;";

    database.query(query, [validated, googleId, imgId], function(err, result) {
        if (err) {
            console.log(err);
        }
    });
}

function storeDrawnImage(data) {
    // Check if type is valid

}

function PacketHandler(data, ws) {
    var client = clients.get(ws);

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
            var dataOut = { "PacketId" : 203, "Data": {
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

        var dataOut = { "PacketId": 202,   "Data": {
            "type": "",
        
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
    var userScore = 16;
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
        var dataOut = { "PacketId": 202,   "Data": {
            "type": "",
        
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
            var dataOut = { "PacketId" : 203, "Data": {
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
