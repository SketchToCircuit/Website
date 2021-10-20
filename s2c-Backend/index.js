const WS = require('ws');
const fs = require('fs');
const https = require('https');
const path = require('path');
const {OAuth2Client} = require('google-auth-library');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'setup.cfg')));

const o2Client = new OAuth2Client(config.serverSettings.o2Id);

const options = {
  key: fs.readFileSync(path.join(__dirname, config.ssl.keyLocation)),
  cert: fs.readFileSync(path.join(__dirname, config.ssl.certLocation))
} //Https ssl options

let server = https.createServer(options, (req, res) => {
    res.writeHead(401);
    res.end("Websocket EndPoint\n");
}).listen(config.serverSettings.backendPort); //Create Https Server

var count = 1;
const wss = new WS.Server({server}); //Create WebSocketServer with the Https server
const clients = new Map(); //Map to store ws instances

function getUniqueId(count) {
    return (Math.floor(Math.random() * 1000) * 10 + count);
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

function PacketHandler(data, ws) {
    try {
        data = JSON.parse(data);
    } catch {return false;}

    if (!data.PacketId) 
        return false;

    if (data.PacketId == 101 && clients.get(ws).isAuth != true) {
        if (data.Data.token == undefined) 
            return false;
        return verifyGoogleToken(data.Data.token).then((payload) => {
            clients
                .get(ws)
                .google = payload;
            clients
                .get(ws)
                .isAuth = true;
            return true;
        }).catch((err) => {
            console.log(err);
            return false;
        });
    }

    if (!clients.get(ws).isAuth) {
        console.log("User is unauthorized");
        return false;
    }     

    switch (data.PacketId) {
        case 102:
            return getUserData(ws);
        case 103:
            return decideIfDrawVal(ws);
        case 104:
            return onImgReceive(data.Data, ws);
        case 105:
            return onValReceive(data.Data, ws);
        default:
            return false;
    }
}

function onValReceive(dataIn, ws) {
    if (dataIn.count >= 0 && dataIn.count < 5) {
        var dataOut = {"PacketId" : 203, "Data": {
            "hintText": "Hint" + (dataIn.count + 1),
            "hintImg": "logo192.png",
            "valImg": "logo512.png",
            "imgId": 1234
        }};
    
        sendData(dataOut, ws);
    } else {
        return false;
    }

    // ToDo save to database

    return true;
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

        sendData(data, ws);
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
    var data = {}

    if (Math.random() > 0.5) {
        data = { "PacketId": 202,   "Data": {
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
    } else {
        data = {"PacketId" : 203, "Data": {
            "hintText": "Hint0",
            "hintImg": "logo192.png",
            "valImg": "logo512.png",
            "imgId": 1234
        }};
    }

    sendData(data, ws);

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

console.log("Wss startet");