//#region lib-requires
const WS = require('ws');
const http = require('http');
const path = require('path');
const { env } = require('process');
//#endregion

//#region src-requires
const UserObject = require('./src/UserObject');
const database = require('./src/mysql');
const google = require('./src/google');
const base64Helper = require('./src/base64Helper');
const websocket = require('./src/websocket');
const dataFolder = require('./src/dataFolder');
//#endregion

//#region vars
const clients = new Map(); //Map to store ws instances
let count = 1;

let server = http.createServer((req, res) => {
    res.writeHead(401);
    res.end("Websocket EndPoint\n");
}).listen(env.BACKENDPORT); //Create Http Server

let wss = new WS.Server({server});
//#endregion

database.init();
dataFolder.init();

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
            console.log(error);
            success = false;
        }
        if (!success) {
            //console.log(`Couldn't handle data: ${JSON.stringify(JSON.parse(data))}`);
        }
    });

    ws.on('close', () => {
        console.log(`Closed connection with id ${clients.get(ws).id}`);
        clients.delete(ws);
    })
});

function getUniqueId(count) {
    return (Math.floor((Math.random() + 1) * 10000) * 10 + count);
}

function PacketHandler(data, ws) {
    let client = clients.get(ws);
    try {
        data = JSON.parse(data);
    } catch {
        return false;
    }

    if (!data.PacketId)
        return false;

    if (data.PacketId == 101 && client.isAuth != true) {
            if (!data.Data.token) return false;
            google.verifyGoogleToken(data.Data.token).then((payload) => {
            client.google = payload;
            
            database.checkUser(payload.sub, () => {
                client.isAuth = true;
                database.AddUser(payload.sub, payload.name);
                websocket.getUserData(ws, client, database);
            });
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
            websocket.getUserData(ws, client, database);
            break;
        case 103:
            websocket.decideIfDrawVal(ws, client, database, base64Helper);
            break;
        case 104:
            websocket.onImgReceive(data.Data, ws, client, database, base64Helper);
            break;
        case 105:
            websocket.onValReceive(data.Data, ws, client, database, base64Helper);
            break;
        default:
            return false;
    }

    return true;
}

console.log("\nWss startet");