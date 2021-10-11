const WS = require('ws');
const HttpsServer = require('https');

//const httpsServer = HttpsServer.createServer({ 
//}); // Will be changed to a HTTPS server for Wss secutity
  var count = 1;
  const wss = new WS.WebSocketServer({ port: 3001 }); //Open WebsocketServer
  const clients = new Map(); //Map to store ws instances


  wss.on('connection', function connection(ws, req) {
    console.log(`Connection from ${req.socket.remoteAddress} with id ${count}`);
    clients.set(ws, count);
    count = count + 1;

    // testing
    const data = {'data' : {'type' : 'VALIDATION', 'imgSrc' : 'https://punkt.de/_Resources/Persistent/7/5/b/d/75bd14d2ed44da6bf49616fd635a36fa4bb2eac8/React_Native_Logo-1196x628.png'}}
    sendData(data, ws);

    ws.on('message', function incoming(data) {
      receiveData(data, ws)
    });
    
    ws.on('close', () => {
        clients.delete(ws);
    })
});

function receiveData(data, ws)
{
  try
  {
    var json = JSON.parse(data);
  }catch{return;}
  PacketHandler(json, ws);
}

function PacketHandler(data, ws)
{
  switch(data.PacketID)
  {
    case '1' : 
    //Handle Data Function
    break;
    default:
      //ErrorHandling
  }
}

function sendData(data, ws) // Send Json data to User
{
  ws.send(JSON.stringify(data));
}

console.log("Wss startet");