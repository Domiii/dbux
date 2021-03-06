import http from 'http';
import { Server } from 'socket.io';  // socket.io@3+
// import Server from 'socket.io';       // socket.io@2
import { newLogger } from '@dbux/common/src/log/logger';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('net/listener');

/**
 * @param {number} port 
 * @return {Promise<httpServer>}
 */
export function makeHttpServer(port) {
  const httpServer = http.createServer();
  // const address = '0.0.0.0';
  const address = '';

  return new Promise((resolve, reject) => {
    httpServer.listen(port, () => {
      debug(`server listening on port ${address}:${port}...`);

      resolve(httpServer);
    });

    httpServer.on('error', err => {
      logError('dbux http server failed', err);

      reject(new Error(`makeHttpServer failed`));
    });
  });
}


export async function makeListenSocket(port) {
  const httpServer = await makeHttpServer(port);

  // see: https://socket.io/docs/server-api/
  const listenSocket = new Server(httpServer, {
    // const server = require('socket.io')(httpServer, {
    serveClient: false,
    allowUpgrades: false,
    /**
     * NOTE: 100MB was the default in v2
     * @see https://socket.io/docs/v4/server-initialization/#maxHttpBufferSize
     */
    maxHttpBufferSize: 1e8,

    // NOTE: `wsEngine` is 'ws' by default since 4.0
    // wsEngine: 'ws' // in case uws is not supported
  });

  listenSocket.on('error', err => {
    logError('dbux listen server failed', err);
  });

  return listenSocket;
}