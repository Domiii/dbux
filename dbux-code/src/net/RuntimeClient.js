import { newLogger, logInternalError } from 'dbux-common/src/log/logger';
import allApplications from 'dbux-data/src/applications/allApplications';
import Application from 'dbux-data/src/applications/Application';

const Verbose = false;

const { log, debug, warn, error: logError } = newLogger('RuntimeClient');

export default class Client {
  server;
  socket;
  application: Application;
  _connected;

  constructor(server, socket) {
    Verbose && debug('connected');

    this.server = server;
    this.socket = socket;
    this._connected = true;

    this.on('error', this._handleError);
    this.on('init', this._handleInit);
    this.on('data', this._handleData);
  }

  isConnected() {
    return this._connected;
  }

  isReady() {
    return !!this.application;
  }

  _getOrCreateApplication(initialData): Application {
    const { applicationId } = initialData;
    let application;
    const firstTime = !applicationId;
    if (firstTime) {
      // first time
      application = allApplications.addApplication(
        initialData
      );
    }
    else {
      // reconnect
      application = allApplications.getById(applicationId);
    }

    log('init', firstTime ? '(new)' : '(reconnect)', application?.entryPointPath);
    return application;
  }

  _handleInit = (initialData) => {
    if (this.isReady()) {
      logError(`${initialData?.entryPointPath} - received init from client twice. Please restart application.`);
    }
    else {
      this.application = this._getOrCreateApplication(initialData);
      if (!this.application) {
        logError(`${initialData?.entryPointPath} - application claims to have reconnected but we don't have any of its previous information. Please restart application.`);
        return;
      }
    }

    debug('init');
    this.socket.emit('init_ack', this.application.applicationId);
  }

  _handleData = (data) => {
    debug('data received; trying to addData...');
    this.application.addData(data);
  }

  /**
   * Called by Server as it helps track connection state.
   */
  _handleDisconnect = () => {
    Verbose && debug('disconnected', this.application?.entryPointPath);
    this._connected = false;
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
}