import { newLogger } from '@dbux/common/src/log/logger';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('RuntimeClient');


export default class SocketClient {
  server;
  socket;

  constructor(server, socket) {
    this.server = server;
    this.socket = socket;

    this.on('error', this._handleError);
    this.on('connect_error', this._handleConnectError);
  }

  isConnected() {
    return this.socket.connected;
  }

  _handleError = (err) => {
    logError(`Socket Error`, err);
  };

  _handleConnectError = err => {
    logError(`Connect Error`, err);
  }

  // ###########################################################################
  // receive data
  // ###########################################################################


  on(eventName, cb) {
    this.socket.on(eventName, (...args) => {
      try {
        cb(...args);
      }
      catch (err) {
        logError(`socket event "${eventName}" failed -`, err.stack);
      }
    });
  }

  dispose() {
    this.socket?.disconnect(true);
  }
}