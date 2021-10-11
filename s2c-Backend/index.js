const WS = require('ws');
const HttpsServer = require('https');

//const httpsServer = HttpsServer.createServer({
//});
  var count = 1;
  const wss = new WS.WebSocketServer({ port: 3000 }); //Open WebsocketServer
  const clients = new Map(); //Map to store ws instances


  wss.on('connection', function connection(ws, req) {
    clients.set(ws, count);
    count = count + 1;
    ws.send('something');
    ws.on('message', function incoming(data) {
      receiveData(data, ws)
    });
    ws.on('close', () => {
      clients.delete(ws);
    })
  });

function receiveData(data, ws)
{
  PacketHandler(JSON.parse(data), ws);
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