const WS = require('ws');
const fs = require('fs');
const https = require('https');
const path = require('path');
const {OAuth2Client} = require('google-auth-library');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'setup.cfg')));

const o2Client = new OAuth2Client(config.serverSettings.o2Id);

const options = {
    key: fs.readFileSync(path.join(__dirname, "../" + config.ssl.keyLocation)),
    cert: fs.readFileSync(path.join(__dirname, "../" + config.ssl.certLocation))
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
       if(!PacketHandler(data, ws)) {
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

    if (data.PacketId == undefined) 
        return false;

    if (data.PacketId == 101 && clients.get(ws).isAuth != true) { //AuthHandle
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

    if (!clients.get(ws).isAuth) 
        return false;

    switch (data.PacketId) {
        case 102:
            getUserData(ws);
            break;
        case 103:
            decideIfDraw(ws);
            break;
        case 104:
            dataCollection(ws);
            break;
        default:
            return false;
    }

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
}

function decideIfDraw(ws) {
    //Logic to decide if draw or val
    console.log("Decide if...");
}

function dataCollection(ws) {

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