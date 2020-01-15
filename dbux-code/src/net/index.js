import http from 'http';
import * as SocketIO from 'socket.io';
import { newLogger } from 'dbux-common/src/log/logger';
import { inspect } from 'util';
import Client from './Client';

const DefaultPort = 3373;

const { log, debug, warn, error: logError } = newLogger('SERVER');

// warn('server/index.js');

let httpServer;

class Server {
  _clients = [];
  _clientEventListeners = {};

  initServer() {
    const io = SocketIO(httpServer, {
      // const io = require('socket.io')(server, {
      // serveClient: false,
      // wsEngine: 'ws' // in case uws is not supported
    });

    io.on('connect', this._handleAccept);
  }

  /**
   * New socket connected
   */
  _handleAccept = (socket) => {
    const client = new Client(socket);
    this._clients.push(client);

    if (this._clients.length > 1) {
      // we don't currently handle more than one client at a time
      logError(`cannot currently handle more than one client at the same time - ${inspect(this._clients.length)}`);
    }

    // handle disconnects
    socket.on('disconnect', function () {
      client._handleDisconnect();
      this.clients = this.clients.filter(c => c !== client);
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
  httpServer = http.createServer();
  const port = process.env.PORT || DefaultPort;
  httpServer.listen(port, () => {
    debug('server listening on port ' + port);
  });

  server = new Server();
  server.initServer();

  return server;
}