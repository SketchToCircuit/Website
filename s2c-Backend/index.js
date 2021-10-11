const WS = require('ws');
const fs = require('fs');
const https = require('https');
const path = require('path');
const {OAuth2Client} = require('google-auth-library');

//Heartbeat needs to be done

const o2id = '197355798433-msk8hu5u74nlqsba1gf533flb3dkatgv.apps.googleusercontent.com'
const o2Client = new OAuth2Client(o2id);

const options = { 
  key : fs.readFileSync(path.join(__dirname ,'/priv/selfsigned.key')),
  cert : fs.readFileSync(path.join(__dirname ,'/priv/selfsigned.crt'))
} //Load auth

let server = https.createServer(options , (req, res) => {
  res.writeHead(200);
  res.end("Websocket EndPoint\n");
}).listen(3001); //Create Https Server

  var count = 1;
  const wss = new WS.Server({server}); //Create WebSocketServer with the Https server
  const clients = new Map(); //Map to store ws instances


  wss.on('connection', function connection(ws, req) {
    console.log(`Connection from ${req.socket.remoteAddress} with id ${count}`);
    var userObjet = new Object;
    userObjet.googleId = "";
    userObjet.count = count;
    count = count + 1;
    userObjet.isAuth = false;
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
      clients.get(ws).googleId = payload.sub;
      clients.get(ws).isAuth = true;
    })
    .catch((err) => {/*Log?*/});
  }
  if(clients.get(ws).isAuth != true) return;
  switch(data.PacketId)
  {
    case '2' : 
      sendData('{"AuthTicket":"ABABABABABABABAB","PacketId":"1","Data":{"Test":"1"}}', ws);
    //Handle Data Function
    break;
    default:
      //ErrorHandling
  }
}

function sendData(data, ws) // Send Json data to User
{
  if(ws.readyState === WS.OPEN)
  {
    ws.send(JSON.stringify(data));
  }
}

function checkAuthTicket(authTicket)
{
  return true;
}
async function verifyGoogleToken(token) //Google verify token
{
  const ticket = await o2Client.verifyIdToken({
    idToken : token,
    audience : o2id
  });
  const payload = ticket.getPayload();
  return payload;
}

console.log("Wss startet");