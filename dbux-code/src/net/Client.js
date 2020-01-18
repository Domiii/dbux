import { newLogger } from 'dbux-common/src/log/logger';

const { log, debug, warn, error: logError } = newLogger('NET');

export default class Client {
  server;
  socket;
  _connected;

  constructor(server, socket) {
    debug('client connected', socket.id);

    this.server = server;
    this.socket = socket;
    this._connected = true;

    socket.on('error', this._handleError);
    // socket.on('data', this.onData);
  }

  isConnected() {
    return this._connected;
  }

  /**
   * Called by Server as it helps track connection state.
   */
  _handleDisconnect() {
    debug('client disconnected', this.socket.id);
    this._connected = false;
  }

  _handleError = (err) => {
    logError(err);
  };

  // ###########################################################################
  // receive data
  // ###########################################################################


  on(eventName, cb) {
    this.socket.on(eventName, cb);
  }
}