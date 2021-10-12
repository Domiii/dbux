/**
 * 
 */

const httpServer = require("http").createServer();
const SocketServer = require("socket.io");
// const SocketClient = require("socket.io-client");
const SocketClient = require("./lib");

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
  socket.on('hi', async (x) => {
    await sleep(200);
    socket.emit('hi back', x);
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
  let n = 5;
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
  // socket.on('connect', async () => {
  //   await sleep(200);
  // });
  socket.emit('hi', n);
  console.log('hi sent!');
  socket.on('connect_error', async () => {
    console.error('CONNECT_ERR', err);
  });
  socket.on('hi back', async (x) => {
    await sleep(200);
    if (!n--) {
      server.close();
      socket.close();
    }
    else {
      console.log('hi REPLY received:', x);
      socket.emit('hi', n);
    }
  });
}
