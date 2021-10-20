const WS = require('ws');
const fs = require('fs');
const https = require('https');
const path = require('path');
const {OAuth2Client} = require('google-auth-library');
const mysql = require('mysql');

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

const https_options = {
  key: fs.readFileSync(path.join(__dirname, config.ssl.keyLocation)),
  cert: fs.readFileSync(path.join(__dirname, config.ssl.certLocation))
} //Https ssl options

let server = https.createServer(https_options, (req, res) => {
    res.writeHead(401);
    res.end("Websocket EndPoint\n");
}).listen(config.serverSettings.backendPort); //Create Https Server

var count = 1;
const wss = new WS.Server({server}); //Create WebSocketServer with the Https server
const clients = new Map(); //Map to store ws instances

function getUniqueId(count) {
    return (Math.floor(Math.random() * 1000) * 10 + count);
}

function getBase64Img(relPath) {
    var img = fs.readFileSync(path.join(__dirname, relPath));
    return 'data:image/png;base64,' + img.toString('base64');
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

// Add googleId to database
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
    var valData = new Object();

    var query = "SELECT * FROM images, component_types WHERE looked_at = FALSE AND component_type = component_id ORDER BY RAND() LIMIT 1;";

    database.query(query, function(err, result) {
        if (err) {
            console.log(err);
        } else if (result.length >= 1) {
            valData.hintText = result[0].val_hint;
            valData.hintImg = getBase64Img(result[0].hint_img);
            valData.valImg = getBase64Img(result[0].image_path);

            return callback(valData);
        }
    });
}

function PacketHandler(data, ws) {
    try {
        data = JSON.parse(data);
    } catch {return false;}

    if (!data.PacketId) 
        return false;

    if (data.PacketId == 101 && clients.get(ws).isAuth != true) {
        if (!data.Data.token) 
            return false;

        verifyGoogleToken(data.Data.token).then((payload) => {
            clients.get(ws).google = payload;
            clients.get(ws).isAuth = true;

            // payload.sub is the googleId
            dbAddUser(payload.sub);
        }).catch((err) => {
            console.log(err);
            clients.get(ws).isAuth = false;
        });

        return true;
    }

    if (!clients.get(ws).isAuth) {
        console.log("User is unauthorized");
        return false;
    }     

    switch (data.PacketId) {
        case 102:
            getUserData(ws);
            break;
        case 103:
            decideIfDrawVal(ws);
            break;
        case 104:
            onImgReceive(data.Data, ws);
            break;
        case 105:
            onValReceive(data.Data, ws);
            break;
        default:
            return false;
    }

    return true;
}

function onValReceive(dataIn, ws) {
    getValidationData(function(valData) {
        if (dataIn.count >= 0 && dataIn.count < 5) {
            var dataOut = { "PacketId" : 203, "Data": {
                "hintText": valData.hintText,
                "hintImg": valData.hintImg,
                "valImg": valData.valImg,
                "imgId": 1234
            }};
        
            sendData(dataOut, ws);
        }
    });
}

function onImgReceive(dataIn, ws) {
    if (dataIn.count >= 0 && dataIn.count < 5) {
        var dataOut = { "PacketId": 202,   "Data": {
            "type": "",
        
            "ComponentHint": {
              "text": "",
              "img": ""
            },
        
            "LabelHint": {
              "text": "",
              "img": ""
            },
          }
        };

        sendData(dataOut, ws);
    } else {
        return false;
    }

    // ToDo save images

    return true;
}

function getUserData(ws) {
    //Database Access for User data <----------------
    var userScore = 16;
    console.log(clients.get(ws).google);

    const data = { "PacketId" : 201, "Data" : {
        "avatar" : clients.get(ws).google.picture,
        "username" : clients.get(ws).google.name,
        "points" : userScore
    }};

    sendData(data, ws);

    return true;
}

function decideIfDrawVal(ws) {

    if (Math.random() > 0.5) {
        var dataOut = { "PacketId": 202,   "Data": {
            "type": "",
        
            "ComponentHint": {
              "text": "",
              "img": ""
            },
        
            "LabelHint": {
              "text": "",
              "img": ""
            },
        }};

        sendData(dataOut, ws);
    } else {
        getValidationData(function(valData) {
            var dataOut = { "PacketId" : 203, "Data": {
                "hintText": valData.hintText,
                "hintImg": valData.hintImg,
                "valImg": valData.valImg,
                "imgId": 1234
            }};
        
            sendData(dataOut, ws);
        });
    }

    return true;
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
        this.status = undefined; //val or draw or non
    }
}

console.log("WSS startet");