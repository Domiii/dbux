import { newLogger } from '@dbux/common/src/log/logger';
import RuntimeClient from './RuntimeClient';
import { makeListenSocket } from './serverUtil';

const DefaultPort = 3374;

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('SocketServer');

/**
 * Server for `dbux-runtime` to connect to.
 * 
 * NOTE: This server's URL is at ws://localhost:<DefaultPort>/socket.io/?transport=websocket
 */
export default class SocketServer {
  _listenSocket;
  _clients = [];

  constructor(ClientClass) {
    this.ClientClass = ClientClass;
  }

  async start(port) {
    this._listenSocket = await makeListenSocket(port);
    this._port = port;
    // debug(`listening on ${port}`);
    this._listenSocket.on('connect', this._handleAccept.bind(this));
    this._listenSocket.on('error', this._handleError.bind(this));
  }

  /**
   * New socket connected
   */
  _handleAccept(socket) {
    const client = new this.ClientClass(this, socket);
    this._clients.push(client);

    // handle disconnects
    socket.on('disconnect', () => {
      this._clients = this._clients.filter(c => c !== client);
      client._handleDisconnect?.();
    });

    return client;
  }

  _handleError(err) {
    logError(err);
  }

  dispose() {
    if (this._listenSocket) {
      this._listenSocket.close();
      debug(`server on ${this._port} has shutdown`);
      this._listenSocket = null;
    }
  }
}

/**
 * @type {SocketServer}
 */
let server;

export async function initRuntimeServer(context) {
  if (!server) {
    server = new SocketServer(RuntimeClient);

    try {
      await server.start(DefaultPort);
      context.subscriptions.push(server);
    } catch (err) {
      server = null;
      throw new Error(`Could not start runtime server. This may due to multiple instances opened.`);
    }
  }

  return server;
}

// export async function stopRuntimeServer() {
//   if (server) {
//     server.dispose();
//     server = null;
//   }
// }