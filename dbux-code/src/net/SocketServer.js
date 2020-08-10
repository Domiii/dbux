import { newLogger } from '@dbux/common/src/log/logger';
import RuntimeClient from './RuntimeClient';
import { makeListenSocket } from './serverUtil';

const DefaultPort = 3374;

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('RuntimeServer');

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
    this._listenSocket?.close();
    this._listenSocket = null;
  }
}

/**
 * @type {SocketServer}
 */
let server;

export async function initRuntimeServer(context) {
  if (!server) {
    server = new SocketServer(RuntimeClient);
    context.subscriptions.push(server);

    try {
      await server.start(DefaultPort);
    } catch (err) {
      server = null;
      throw new Error(`Could not start runtime server. This may due to multiple instances opened.`);
    }
  }

  return server;
}
