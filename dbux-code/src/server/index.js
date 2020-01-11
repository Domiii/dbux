import http from 'http';
// import * as SocketIO from 'socket.io';

console.log('server/index.js');


function onConnect(socket) {
  console.log('connect ' + socket.id);

  socket.on('disconnect', () => console.log('disconnect ' + socket.id));
}

export function initServer() {
  const server = http.createServer();
  // const io = SocketIO(server, {
  const io = require('socket.io')(server, {
    serveClient: false,
    wsEngine: 'ws' // uws is not supported since it is a native module
  });
  const port = process.env.PORT || 3060;

  io.on('connect', onConnect);
  server.listen(port, () => console.log('server listening on port ' + port));
}