import http from 'http';
import { Server } from 'socket.io';  // socket.io@3+
// import msgpackParser from 'socket.io-msgpack-parser';
import msgpackParser from '@dbux/common/src/msgpackParser';

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
      debug(`server listening on ${address}:${port}...`);

      resolve(httpServer);
    });

    httpServer.on('connect', () => {
      debug(`client connection incoming...`);
    });

    httpServer.on('finish', () => {
      debug(`HTTP finish.`);
    });

    httpServer.on('clientError', (err, socket) => {
      logError(`HTTP clientError ${socket?.id}`, err);
    });

    httpServer.on('error', err => {
      logError('HTTP server failed', err);

      reject(new Error(`makeHttpServer failed`));
    });
  });
}


export async function makeListenSocket(port) {
  const httpServer = await makeHttpServer(port);

  /**
   * @see https://socket.io/docs/server-api/
   * @see https://github.com/socketio/socket.io/blob/master/lib/index.ts#L143
   */
  const listenSocket = new Server(httpServer, {
    // NOTE: `wsEngine` is 'ws' by default since 4.0
    // wsEngine: 'ws' // in case uws is not supported

    // const server = require('socket.io')(httpServer, {
    serveClient: false,
    allowUpgrades: true,
    /**
     * NOTE: 100MB was the default in v2
     * @see https://socket.io/docs/v4/server-initialization/#maxHttpBufferSize
     */
    maxHttpBufferSize: 2e9,

    /**
     * @see https://github.com/socketio/socket.io/issues/2769
     */
    pingTimeout: 1e6,

    // parser: msgpackParser
  });

  return listenSocket;
}