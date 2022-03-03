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

const clients = new Map(); //Create map to store ws instances
let count = 1; //Nbr of clients that are and were connected

let server = http.createServer((req, res) => {
    res.writeHead(401);
    res.end("Websocket EndPoint\n");
}).listen(env.BACKENDPORT);//Create http server and define GET handeling

let wss = new WS.Server({server});

database.init();//Open Database connection
dataFolder.init();//Initalize folders and files

wss.on('connection', function connection(ws, req) {//Create websocket connection event
    ws.ping()

    const id = getUniqueId(count);//Get unique id for user based on count
    count += 1;//Increase count with every connection

    let userObject = new UserObject(id);//Create userobject with unique id

    clients.set(ws, userObject);//Add userobject to map and use the websocket as the key

    ws.on('message', function incoming(data) {//Create message listener
        let success = false;
        try {
            success = PacketHandler(data, ws);//Handle messages
        } catch (error) {//Log data on error
            dataFolder.writeErrorLog(error, "Ws-Error")
            success = false;
        }
        if (!success) {//Log data on unsuccessful handle
            let message = `Couldn't handle data: ${JSON.stringify(JSON.parse(data))}`;
            dataFolder.writeErrorLog(message, "Not-Handled");
        }
    });

    ws.on('close', () => {//Delete entry from map when websocket disconnects
        clients.delete(ws);
    })
});

function getUniqueId(count) {//Return unique id based on count
    return (Math.floor((Math.random() + 1) * 10000) * 10 + count);
}

function PacketHandler(data, ws) {//Handle data received from websocket
    let client = clients.get(ws);//Get userobject from map
    try {//Parse data into json object
        data = JSON.parse(data);
    } catch {
        return false;
    }

    if (!data.PacketId)//Return when packetid is empty
        return false;

    if (data.PacketId == 101 && client.isAuth != true) {//Authenticate connection
            if (!data.Data.token) return false; //return on empty token
            google.verifyGoogleToken(data.Data.token).then((payload) => {//Verify received goolge token
                client.google = payload;//Add google data to userobject
                
                database.checkUser(payload.sub, () => {//Check if user is untrusted
                    client.isAuth = true;
                    database.AddUser(payload.sub, payload.name, payload.email);
                });
                websocket.getUserData(ws, client, database);//Send userdata to client
            }).catch((err) => {
                dataFolder.writeErrorLog(err, "API-Error")
                console.log(err);
                client.isAuth = false;
            });

        return true;
    }

    if (!clients.get(ws).isAuth) {//If websocket is not authenticated return
        return false;
    }

    switch (data.PacketId) {
        case 102://Get userdata
            websocket.getUserData(ws, client, database);
            break;
        case 103://Decide if user has to draw or validate
            websocket.decideIfDrawVal(ws, client, database, base64Helper);
            break;
        case 104://Receive image
            websocket.onImgReceive(data.Data, ws, client, database, base64Helper);
            break;
        case 105://Receive validation
            websocket.onValReceive(data.Data, ws, client, database, base64Helper);
            break;
        default:
            return false;
    }

    return true;
}

console.log("Running");