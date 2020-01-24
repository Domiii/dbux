import io, { Socket } from 'socket.io-client';
import { newLogger, logInternalError } from 'dbux-common/src/log/logger';
import SendQueue from './SendQueue';

const { log, debug, warn, error: logError } = newLogger('CLIENT');

// ########################################
// config
// ########################################

const InactivityDelay = 5000;
const DefaultPort = 3374;
const Remote = `ws://localhost:${DefaultPort}`;


export default class Client {
  /**
   * @type {Socket}
   */
  _socket;

  /**
   * @type {SendQueue}
   */
  _sendQueue;
  _connected = false;

  constructor() {
    this._sendQueue = new SendQueue(this);
  }

  isConnected() {
    return this._connected;
  }

  // ###########################################################################
  // event handling
  // ###########################################################################

  _handleConnect = () => {
    debug('connected');
    this._connected = true;

    // send out anything that was already buffered
    this._sendQueue._flushLater();

    // kill socket after configured period of inactivity
    this._refreshInactivityTimer();
  };

  _handleConnectFailed = () => {
    debug('failed to connect')
  }

  _handleDisconnect = () => {
    debug('disconnected');
    this._connected = false;
  }

  _handleError = (err) => {
    logError(err);
  };

  // ###########################################################################
  // sending data
  // ###########################################################################

  send(dataName, data) {
    // TODO: in case of "immediate sync mode", use sendNow instead
    this._sendQueue.send(dataName, data);
  }

  sendAll(dataName, data) {
    this._sendQueue.sendAll(dataName, data);
  }

  /**
   * Send data to remote end.
   * 
   * NOTE: Uses engine.io's serialization engine.
   * @see https://github.com/socketio/engine.io-parser/blob/master/lib/index.js#L55
   */
  sendNow(data) {
    if (!this._socket) {
      this._connect();
    }
    if (this.isConnected()) {
      this._socket.emit('data', data);
      this._refreshInactivityTimer();
      return true;
    }
    return false;
  }

  // ###########################################################################
  // connect
  // ###########################################################################
  
  _connect() {
    const socket = this._socket = io.connect(Remote, {
      // jsonp: false,
      // forceNode: true,
      port: DefaultPort,
      transports: ['websocket']
    });

    // on reconnection, reset the transports option, as the Websocket
    // connection may have failed (caused by proxy, firewall, browser, ...)
    socket.on('reconnect_attempt', () => {
      warn('reconnecting...');
      // socket.io.opts.transports = ['websocket'];
    });

    socket.on('connect', this._handleConnect);
    socket.on('connect_error', this._handleConnectFailed);
    socket.on('disconnect', this._handleDisconnect);
    socket.on('error', this._handleError);
  }

  // ###########################################################################
  // auto-disconnect regularly, so program won't run forever
  // ###########################################################################

  _refreshInactivityTimer() {
    if (this._killTimer) {
      clearTimeout(this._killTimer);
    }
    this._killTimer = setTimeout(this._disconnect, InactivityDelay);
  }

  _disconnect = () => {
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }
  }
}
