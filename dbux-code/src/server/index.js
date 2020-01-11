import http from 'http';

const log = (...args) => console.log('[dbux-code][server]', ...args)

log('server/index.js');

function onConnect(socket) {
  log('connect ' + socket.id);

  // handle events here
  

  socket.on('disconnect', () => log('disconnect ' + socket.id));
}

export function initServer() {
  const server = http.createServer();
  const io = require('socket.io')(server, {
    serveClient: false,
    wsEngine: 'ws' // uws is not supported since it is a native module
  });
  const port = process.env.PORT || 3060;

  io.on('connect', onConnect);
  server.listen(port, () => log('server listening on port ' + port));

  log('Sucessfully "initServer".')
}