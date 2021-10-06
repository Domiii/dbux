/**
 * 
 */

const httpServer = require("http").createServer();
const SocketServer = require("socket.io");
const SocketClient = require("socket.io-client");

const port = 30011;

/** ###########################################################################
 * server
 * @see https://socket.io/docs/v2/server-initialization/
 * ##########################################################################*/
const server = SocketServer(httpServer, {
  port
  // ...
});

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

server.on("connection", (socket) => {
  socket.on('ping', async () => {
    await sleep(50);
    socket.emit('pong');
  });
});

httpServer.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);

  startClient();
});

/** ###########################################################################
 * client
 * @see https://socket.io/docs/v2/client-initialization/
 * ##########################################################################*/

const Remote = `ws://localhost:${port}`;

function startClient() {
  let n = 3;
  const socket = SocketClient(Remote, {
    /**
     * hackfix
     * @see https://github.com/socketio/socket.io-client/issues/1097#issuecomment-301301030
     */
    transports: ['websocket']
  });
  socket.on('error', (err) => {
    console.error('ERR', err);
  });
  socket.on('connect', async () => {
    console.log('PING sent!');
    socket.emit('ping');
  });
  socket.on('pong', () => {
    if (!--n) {
      socket.close();
    }
    else {
      console.log('PONG received!');
      socket.emit('ping');
    }
  });
}
