import { newLogger } from 'dbux-common/src/log/logger';

const { log, debug, warn, error: logError } = newLogger('NET');

export default class Client {
  server;
  socket;

  constructor(server, socket) {
    debug('client connected', socket.id);

    this.server = server;
    this.socket = socket;

    socket.on('error', this._handleError);
    // socket.on('data', this.onData);
  }

  _handleDisconnect() {
    debug('client disconnected', this.socket.id);
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