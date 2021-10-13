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
  res.writeHead(401);
  res.end("Websocket EndPoint\n");
}).listen(config.serverSettings.port); //Create Https Server

var count = 1;
const wss = new WS.Server({server}); //Create WebSocketServer with the Https server
const clients = new Map(); //Map to store ws instances

wss.on('connection', function connection(ws, req) {
    console.log(`Connection from ${req.socket.remoteAddress} with id ${count}`);
    var userObject = new UserObject(count);
    count = count + 1;
    clients.set(ws, userObject);
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
    if(data.Data.token == undefined) return;
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
      sendData(`{"PacketId":"1","Data":{"avatar":"${clients.get(ws).google.picture}","username":"${clients.get(ws).google.name}","points":"${userScore}"}}`, ws);
    break;
    default:
  }
}

function sendData(data, ws) { // Send Json data to User
    if (ws.readyState === WS.OPEN) {
        ws.send(JSON.stringify(data));
    }
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

function UserObject(id)
{
  this.count = id;
  this.isAuth = false;
  this.google = undefined;
  this.status = {};
}

console.log("Wss startet");