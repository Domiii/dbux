import NanoEvents from 'nanoevents';
import { logDebug, newLogger } from '@dbux/common/src/log/logger';
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
    this._listenSocket.on('connect_error', this._handleConnectError.bind(this));
    this._listenSocket.on('disconnect', this._handleDisconnect);
    this._listenSocket.engine.on("connection_error", (err) => {
      const { req } = err;
      /** @see https://stackoverflow.com/a/19524949 */
      const ip = req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        null;
      logError(`[connection_error] code=${err.code}, ip=${ip}, message="${err.message}"`,
        err.context && `context="${err.context}"`
      );
    });
  }

  /**
   * New socket connected
   */
  _handleAccept(socket) {
    const client = new this.ClientClass(this, socket);
    this._clients.push(client);
    logDebug('Client Connected', socket.id);

    // handle disconnects
    socket.on('disconnect', () => {
      logDebug('Client Disconnected', socket.id);
      this._clients = this._clients.filter(c => c !== client);
      client._handleDisconnect?.();
    });

    return client;
  }

  _handleError(err) {
    logError('error', err);
  }

  _handleConnectError(err) {
    logError('connect_error', err);
  }

  _handleDisconnect(...args) {
    logDebug('disconnected.', ...args);
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
let server = null;
const _runtimeServerEmitter = new NanoEvents();

export async function initRuntimeServer(context) {
  if (!server) {
    server = new SocketServer(RuntimeClient);

    try {
      await server.start(DefaultPort);
      context.subscriptions.push(server);
      _runtimeServerEmitter.emit('statusChanged', true);
    } catch (err) {
      server = null;
      throw new Error(`Could not start runtime server. This may be due to multiple instances opened.\n\n${err.stack}`);
    }
  }

  return server;
}

export function stopRuntimeServer() {
  if (server) {
    server.dispose();
    server = null;
    _runtimeServerEmitter.emit('statusChanged', false);
  }
}

export function isRuntimeServerStarted() {
  return !!server;
}

export function onRuntimerServerStatusChanged(cb) {
  return _runtimeServerEmitter.on('statusChanged', cb);
}