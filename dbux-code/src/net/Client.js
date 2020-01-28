import { newLogger } from 'dbux-common/src/log/logger';
import applicationCollection from 'dbux-data/src/applicationCollection';
import Application from 'dbux-data/src/Application';

const { log, debug, warn, error: logError } = newLogger('net-client');

export default class Client {
  server;
  socket;
  application : Application;
  _connected;

  constructor(server, socket) {
    debug('connected', socket.id);

    this.server = server;
    this.socket = socket;
    this._connected = true;

    socket.on('error', this._handleError);
    socket.on('data', this._handleData);
  }

  isConnected() {
    return this._connected;
  }

  isReady() {
    return !!this.application;
  }

  _handleData = (data) => {
    if (!this.isReady()) {
      // first bit of data received
      this.application = applicationCollection.getOrCreateApplication(data);
      if (!this.application) {
        logError('Invalid data received: cannot application because it has no entry point. Please restart application.');
        return;
      }
    }

    this.application.addData(data);
  }

  /**
   * Called by Server as it helps track connection state.
   */
  _handleDisconnect = () => {
    debug('disconnected', this.socket.id);
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