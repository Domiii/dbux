import http from 'http';
import * as SocketIOServer from 'socket.io';
import { newLogger, logWarn } from 'dbux-common/src/log/logger';
import RuntimeClient from './RuntimeClient';

const DefaultPort = 3374;

const { log, debug, warn, error: logError } = newLogger('net-server');

/**
 * Server for `dbux-runtime` to connect to.
 * 
 * NOTE: This server's URL is at ws://localhost:<DefaultPort>/socket.io/?transport=websocket
 */
class Server {
  _socket;
  _clients = [];

  initServer(httpServer) {
    // see: https://socket.io/docs/server-api/
    const server = this._socket = SocketIOServer(httpServer, {
    // const server = this._socket = require('socket.io')(httpServer, {
      serveClient: false,

      // see: https://github.com/socketio/engine.io/blob/6a16ea119280a02029618544d44eb515f7f2d076/lib/server.js#L107
      wsEngine: 'ws' // in case uws is not supported
    });

    server.on('connect', this._handleAccept);
    server.on('error', err => {
      logError('dbux server failed', err);
    });
    httpServer.on('error', err => {
      logError('dbux server failed', err);
    });
  }

  /**
   * New socket connected
   */
  _handleAccept = (socket) => {
    const client = new RuntimeClient(this, socket);
    this._clients.push(client);

    // handle disconnects
    socket.on('disconnect', () => {
      client._handleDisconnect();
      this._clients = this._clients.filter(c => c !== client);
    });
  }
}


let server;

export function initServer() {
  const httpServer = http.createServer();
  const port = DefaultPort;
  // const address = '0.0.0.0';
  const address = '';
  httpServer.listen(port, () => {
    debug(`server listening on port ${address}:${port}...`);
  });

  server = new Server();
  server.initServer(httpServer);

  return server;
}

export function getServer() {
  return server;
}