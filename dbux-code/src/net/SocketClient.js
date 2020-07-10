import { newLogger, logInternalError } from 'dbux-common/src/log/logger';
import allApplications from 'dbux-data/src/applications/allApplications';
import Application from 'dbux-data/src/applications/Application';


const { log, debug, warn, error: logError } = newLogger('RuntimeClient');


export default class SocketClient {
  server;
  socket;

  constructor(server, socket) {
    this.server = server;
    this.socket = socket;

    this.on('error', this._handleError);
  }

  isConnected() {
    return this.socket.connected;
  }

  _handleError = (err) => {
    logError(err);
  };

  // ###########################################################################
  // receive data
  // ###########################################################################


  on(eventName, cb) {
    this.socket.on(eventName, (...args) => {
      try {
        cb(...args);
      }
      catch (err) {
        logError(`socket event ${eventName} failed`, err);
      }
    });
  }

  dispose() {
    this.socket?.disconnect(true);
  }
}