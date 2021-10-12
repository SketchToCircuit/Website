const WS = require('ws');
const fs = require('fs');
const https = require('https');
const path = require('path');
const {OAuth2Client} = require('google-auth-library');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'setup.cfg')));

//Heartbeat needs to be done <------------

const o2Client = new OAuth2Client(config.serverSettings.o2Id);

const options = { 
  key : fs.readFileSync(path.join(__dirname , config.ssl.keyLocation)),
  cert : fs.readFileSync(path.join(__dirname , config.ssl.certLocation))
} //Load auth

let server = https.createServer(options , (req, res) => {
  res.writeHead(200);
  res.end("Websocket EndPoint\n");
}).listen(config.serverSettings.port); //Create Https Server

var count = 1;
const wss = new WS.Server({server}); //Create WebSocketServer with the Https server
const clients = new Map(); //Map to store ws instances

wss.on('connection', function connection(ws, req) {
    console.log(`Connection from ${req.socket.remoteAddress} with id ${count}`);
    var userObjet = new Object;
    userObjet.google = "";
    userObjet.count = count;
    userObjet.isAuth = false;
    userObjet.status = {};
    count = count + 1;
    clients.set(ws, userObjet);

    ws.on('message', function incoming(data) {
        PacketHandler(data, ws);
    });

    ws.on('close', () => {
        clients.delete(ws);
    })
});

function PacketHandler(data, ws)
{
  try
  {
    data = JSON.parse(data);
  }catch{return;}
  if(data.PacketId == undefined) return;
  if(data.PacketId == 1 && clients.get(ws).isAuth != true)//AuthHandle
  {
    if(data.AuthTicket == undefined) return;
    if(data.Data.token == undefined) return;
    if(!checkAuthTicket(data.AuthTicket)) return;
    verifyGoogleToken(data.Data.token)
    .then((payload) => {
      clients.get(ws).google = payload;
      clients.get(ws).isAuth = true;
    })
    .catch((err) => {console.log(err)/*Log?*/});
  }
  if(clients.get(ws).isAuth != true) return;
  switch(data.PacketId)
  {
    case '2' :
    //Database Access for User data <----------------
    var userScore = 16;
      sendData(`{"AuthTicket":"16 Characters?","PacketId":"1","Data":{"avatar":"${clients.get(ws).google.picture}","username":"${clients.get(ws).google.name}","points":"16"}}`, ws);
    break;
    default:
  }
}

function sendData(data, ws) { // Send Json data to User
    if (ws.readyState === WS.OPEN) {
        ws.send(JSON.stringify(data));
    }
}

function checkAuthTicket(authTicket) {
    return true;
}
async function verifyGoogleToken(token) //Google verify token
{
  const ticket = await o2Client.verifyIdToken({
    idToken : token,
    audience : config.serverSettings.o2Id
  });
  const payload = ticket.getPayload();
  return payload;
}

console.log("Wss startet");