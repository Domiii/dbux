import http from 'http';
import * as SocketIOServer from 'socket.io';
import { newLogger, logWarn } from 'dbux-common/src/log/logger';
import { inspect } from 'util';
import Client from './Client';

const DefaultPort = 3374;

const { log, debug, warn, error: logError } = newLogger('SERVER');

/**
 * NOTE: We can connect to this server at ws://localhost:3374/socket.io/?transport=websocket
 */
class Server {
  _socket;
  _clients = [];
  _clientEventListeners = {};

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
      console.error('dbux server failed', err);
    });
    httpServer.on('error', err => {
      console.error('dbux server failed', err);
    });
  }

  /**
   * New socket connected
   */
  _handleAccept = (socket) => {
    const client = new Client(this, socket);
    this._clients.push(client);

    if (this._clients.length > 1) {
      // we don't currently handle more than one client at a time
      logWarn(`more than one client connected at the same time - but data is not properly organized by client - ${inspect(this._clients.length)}`);
    }

    // handle disconnects
    socket.on('disconnect', () => {
      client._handleDisconnect();
      this._clients = this._clients.filter(c => c !== client);
    });

    // attach event listeners
    for (const eventName in this._clientEventListeners) {
      const cb = this._clientEventListeners[eventName];
      // this._attachEventListener(client, eventName, cb);
      client.on(eventName, (...args) => {
        cb(client, ...args);
      });
    }
  }

  /**
   * Add event listener applied to all clients.
   */
  on(eventName, cb) {
    this._clientEventListeners[eventName] = cb;

    if (this._clients.length) {
      throw new Error('tried to add event listener after clients have already connected. This easily leads to data loss...');
    }

    // // attach event listeners to already existing clients
    // for (const client of this._clients) {
    //   client.on(eventName, cb);
    // }
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
  httpServer.on('request', (req, res) => {
    debug('HTTP request', req);
    res.writeHead(404);
    res.end();
  });

  server = new Server();
  server.initServer(httpServer);

  return server;
}