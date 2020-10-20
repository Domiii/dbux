import 'ws'; // this must work!
import io, { Socket } from 'socket.io-client';
import { newLogger, logInternalError } from '@dbux/common/src/log/logger';
import universalLibs from '@dbux/common/src/util/universalLibs';
import SendQueue from './SendQueue';

const Verbose = true;
// const Verbose = false;

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Runtime Client');

// ###########################################################################
// config
// ###########################################################################

const StayAwake = false;
const SleepDelay = 1000;
const DefaultPort = 3374;
const Remote = `ws://localhost:${DefaultPort}`;

// ###########################################################################
// time management
// ###########################################################################

const createdAt = Date.now();

// ###########################################################################
// utilities
// ###########################################################################

function extractEntryPointPathFromInitialData(initialData) {
  const { staticProgramContexts } = initialData;
  const entryPoint = staticProgramContexts && staticProgramContexts[0];
  if (entryPoint && entryPoint.programId === 1) {
    return entryPoint.filePath;
  }
  return '';
}

// ###########################################################################
// Client
// ###########################################################################

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

    if (StayAwake) {
      // connect + stay awake
      this._connect();
    }
  }

  isConnected() {
    return this._connected;
  }

  isReady() {
    return this._ready;
  }

  hasFlushed() {
    return this._sendQueue.empty;
  }

  // ###########################################################################
  // event handling
  // ###########################################################################

  _connectFailed = false;

  _handleConnect = () => {
    Verbose && debug('connected');
    this._connected = true;
    this._connectFailed = false;

    // start initial handshake
    this._sendInit();
  };

  _handleConnectFailed = (err) => {
    // Verbose && 
    if (!this._connectFailed) {
      this._connectFailed = true;
      debug(`failed to connect (${err.message || err}). Reconnecting...`);
    }
  }

  _handleDisconnect = () => {
    Verbose && debug('disconnected');
    this._connected = false;
    this._ready = false;
    this._socket = null;
  }

  _handleError = (err) => {
    logError(err);
    this._disconnect();
  };

  // ###########################################################################
  // sending data
  // ###########################################################################

  /**
   * Start initial handshake
   */
  _sendInit() {
    let initPacket;
    if (this._applicationId) {
      initPacket = { applicationId: this._applicationId };
    }
    else {
      // NOTE: we don't start using the client, 
      //    unless some code has already executed, so `initialData` should be there
      const initialData = this._sendQueue.buffers;
      const entryPointPath = extractEntryPointPathFromInitialData(initialData);

      if (!entryPointPath) {
        logError('No `entryPointPath` found in initial data', initialData);
      }

      // get time origin - see https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp#The_time_origin
      // const createdAt = Math.round(Date.now() - universalLibs.performance.now());
      initPacket = {
        entryPointPath,
        createdAt
      };
    }

    // send init to server
    this._socket.emit('init', initPacket);

    // wait for ack to come back from server
    this._socket.once('init_ack', applicationId => {
      // then: remember applicationId
      this._applicationId = applicationId;

      // ready!
      this._ready = true;

      // finally: send out anything that was already buffered
      this._sendQueue._flushLater();
    });
  }

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
   * NOTE: This uses `engine.io`'s serialization, followed by processing in `ws`.
   * @see https://github.com/socketio/engine.io-parser/blob/master/lib/index.js#L55
   */
  sendNow(data) {
    if (!this._socket) {
      this._connect();
    }
    else if (this.isReady()) {
      this._socket.emit('data', data);
      this._refreshInactivityTimer();
      return true;
    }
    return false;
  }

  /**
   * NOTE: will send out data right away, if it is already connected.
   * If it is not connected, will try to send data as early as possible.
   */
  tryFlush() {
    this._sendQueue.flush();
  }

  // ###########################################################################
  // connect
  // ###########################################################################

  _connect() {
    // debugger;
    const socket = this._socket = io.connect(Remote, {
      // jsonp: false,
      // forceNode: true,
      port: DefaultPort,
      transports: ['websocket']
    });

    // on reconnection, reset the transports option
    // -> because the Websocket
    //  connection may have failed (caused by proxy, firewall, browser, ...)
    socket.on('reconnect_attempt', () => {
      Verbose && debug('reconnecting...');
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
    if (StayAwake) {
      // stay awake
      return;
    }

    // disconnect after a while
    if (this._killTimer) {
      clearTimeout(this._killTimer);
    }
    this._killTimer = setTimeout(this._disconnect, SleepDelay);
  }

  _disconnect = () => {
    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }
    this._connected = false;
    this._ready = false;
  }
}
