import io from 'socket.io-client';
import { newLogger, logInternalError } from 'dbux-common/src/log/logger';
import SendQueue from './SendQueue';

const { log, debug, warn, error: logError } = newLogger('SERVER');


const DefaultPort = 3373;
const url = 'http://localhost:' + DefaultPort;


class Client {
  _socket;
  _sendQueue;

  constructor() {
    const socket = this._socket = io(url, {
      transports: ['websocket']
    });
    this._sendQueue = new SendQueue(this);

    // on reconnection, reset the transports option, as the Websocket
    // connection may have failed (caused by proxy, firewall, browser, ...)
    socket.on('reconnect_attempt', () => {
      warn('reconnect');
      socket.io.opts.transports = ['polling', 'websocket'];
    });

    socket.on('connect', this._handleConnect);
    socket.on('error', this._handleError)
  }

  // ###########################################################################
  // events handling
  // ###########################################################################

  _handleConnect = () => {
    debug('connected');
  };

  _handleError = (err) => {
    logError(err);
  };

  // ###########################################################################
  // sending data
  // ###########################################################################

  send(dataName, data) {
    // TODO: use sendNow, if "immediate sync mode" enabled
    this._sendQueue.send(dataName, data);
  }

  sendAll(dataName, data) {
    this._sendQueue.sendAll(dataName, data);
  }

  sendNow(data) {
    this._socket.emit('data', data);
  }
}


let client;

export function getDefaultClient() {
  return client;
}

export function initClient() {
  if (client) {
    logInternalError('initClient called more than once');
  }
  client = new Client();
  return client;
}