import io from 'socket.io-client';
import { newLogger, logInternalError } from 'dbux-common/src/log/logger';
import SendQueue from './SendQueue';

const { log, debug, warn, error: logError } = newLogger('CLIENT');

const DefaultPort = 3373;
const url = 'http://localhost:' + DefaultPort;


export default class Client {
  _socket;
  /**
   * @type {SendQueue}
   */
  _sendQueue;
  _connected = false;

  constructor() {
    const socket = this._socket = io(url, {
      transports: ['websocket']
    });
    this._sendQueue = new SendQueue(this);

    // on reconnection, reset the transports option, as the Websocket
    // connection may have failed (caused by proxy, firewall, browser, ...)
    socket.on('reconnect_attempt', () => {
      warn('reconnecting...');
      socket.io.opts.transports = ['polling', 'websocket'];
    });

    socket.on('connect', this._handleConnect);
    socket.on('connect_error', this._handleConnectFailed);
    socket.on('disconnect', this._handleDisconnect);
    socket.on('error', this._handleError);
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
    this._sendQueue._flushLater();
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
    if (this.isConnected()) {
      this._socket.emit('data', data);
      return true;
    }
    return false;
  }
}
