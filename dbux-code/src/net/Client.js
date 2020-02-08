import { newLogger, logInternalError } from 'dbux-common/src/log/logger';
import applicationCollection from 'dbux-data/src/applicationCollection';
import Application from 'dbux-data/src/Application';

const { log, debug, warn, error: logError } = newLogger('net-client');

export default class Client {
  server;
  socket;
  application: Application;
  _connected;

  constructor(server, socket) {
    debug('connected');

    this.server = server;
    this.socket = socket;
    this._connected = true;

    socket.on('error', this._handleError);
    socket.on('init', this._handleInit);
    socket.on('data', this._handleData);
  }

  isConnected() {
    return this._connected;
  }

  isReady() {
    return !!this.application;
  }

  _getOrCreateApplication(initialData): Application {
    const { applicationId, entryPointPath } = initialData;
    let application;
    const firstTime = !applicationId;
    if (firstTime) {
      // first time
      application = applicationCollection.addApplication(entryPointPath);
    }
    else {
      // reconnect
      application = applicationCollection.getById(applicationId);
    }

    log('init', firstTime ? '(new)' : '(reconnect)', application?.entryPointPath);
    return application;
  }

  _handleInit = (initialData) => {
    if (this.isReady()) {
      logError('received init from client twice. Please restart application -', initialData?.entryPointPath);
    }
    else {
      this.application = this._getOrCreateApplication(initialData);
      if (!this.application) {
        logError('application reconnected but `applicationId` not found. Please restart application -', initialData?.entryPointPath);
        return null;
      }
    }

    this.socket.emit('init_ack', this.application.applicationId);
  }

  _handleData = (data) => {
    this.application.addData(data);
  }

  /**
   * Called by Server as it helps track connection state.
   */
  _handleDisconnect = () => {
    debug('disconnected', this.application?.entryPointPath);
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