// import 'ws'; // this must work on Node!
import io, { Socket } from 'socket.io-client';
import msgpackParser from 'socket.io-msgpack-parser';
import minBy from 'lodash/minBy';
import maxBy from 'lodash/maxBy';
import { logWarn, newLogger } from '@dbux/common/src/log/logger';
import sleep from '@dbux/common/src/util/sleep';
import { getDataCount } from '@dbux/common/src/util/dataUtil';
// import universalLibs from '@dbux/common/src/util/universalLibs';
import SendQueue from './SendQueue';

const Verbose = 1;
// const Verbose = 2;
// const Verbose = 0;

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError, trace: logTrace } = newLogger('Runtime Client');

// ###########################################################################
// config
// ###########################################################################

const StayAwake = false;
const SleepDelay = 1000;
const DefaultPort = 3374;

// ###########################################################################
// time management
// ###########################################################################

const createdAt = Date.now();

// ###########################################################################
// utilities
// ###########################################################################

function extractEntryPointPathFromInitialData(initialData) {
  const { staticProgramContexts } = initialData;
  const entryPoint = staticProgramContexts &&
    minBy(staticProgramContexts, program => program.programIndex) || staticProgramContexts[0];
  // debug('extractEntryPointPathFromInitialData', staticProgramContexts);
  return entryPoint?.filePath || '';
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

  hasFinished() {
    return !this._sending && this._sendQueue.isEmpty;
  }

  // ###########################################################################
  // event handling
  // ###########################################################################

  _connectFailed = false;

  _handleConnect = (socket) => {
    if (socket && !this._socket && !this._connectFailed) {
      /**
       * WARNING: if sending data is followed by an unknown disconnect,
       *      it is likely due to error #1009: Max payload size exceeded.
       *      socket.io does not seem to convey that message from the underlying WS implementation.
       *      The issue is usually accompanied by a follow-up (re-)connect, despite being disconnected.
       *      -> sln: adjust `maxHttpBufferSize` on server side.
       *
       * @see https://github.com/websockets/ws/blob/abde9cfc21ce0f1cb7e2556aea70b423359364c7/lib/receiver.js#L371
       */
      // eslint-disable-next-line max-len
      logWarn(`Connection incoming while disconnected. If you were connected before, This might (or might not) be an unintended sign that sent data exceeds the configured server maximum. In that case, consider increasing the maximum via socket.io's maxHttpBufferSize.`);
    }
    this._socket = socket;
    Verbose > 1 && debug('-> connected', !!socket);
    this._connected = true;
    this._connectFailed = false;

    // start initial handshake
    this._sendInit();
  };

  _handleConnectFailed = (err) => {
    // Verbose && 
    if (!this._connectFailed) {
      this._connectFailed = true;
      let msg = err.message || err;
      if (Date.now() - this._connectStart > 20 * 1000) {
        /**
         * NOTE: Timeout during handshake not reported correctly.
         * @see https://github.com/socketio/socket.io/issues/4062
         */
        msg += ` (possibly due to timeout)`;
      }
      debug(`failed to connect - "${msg}". Will keep trying to reconnect...`);
    }
  }

  _handleDisconnect = () => {
    Verbose && debug('-> disconnected');
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
      // hackfix: we don't start using the client, unless some code has already executed, 
      //  -> so `initialData` should have the data we need
      const initialData = this._sendQueue.firstBuffer;
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
    // Verbose && debug(`<- init`, initPacket);
    this._socket.emit('init', initPacket);

    // wait for ack to come back from server
    this._socket.once('init_ack', applicationId => {
      Verbose > 1 && debug(`-> init_ack`, initPacket);
      // NOOP experiment - see https://github.com/socketio/socket.io/issues/3946
      // const N = 1e6;
      // const noopData = new Array(N).fill(1).join('');
      // this._socket.emit('noop', noopData);
      // debug(`<- noop, N=${N}`);

      // remember applicationId
      this._applicationId = applicationId;
      // ready!
      this._ready = true;
      // finally: send out anything that was already buffered
      this._sendQueue._flushLater();
    });
  }

  send(dataName, data) {
    // future-work: in case of "immediate sync mode", use sendNow instead?
    // NOTE: all instances of the [edit-after-send] tag need to be fixed if send delay is disabled.
    this._sendQueue.send(dataName, data);
  }

  sendAll(dataName, data) {
    this._sendQueue.sendAll(dataName, data);
  }

  _sending = 0;

  /**
   * @see https://stackoverflow.com/a/68903628/2228771
   */
  sendWithAck(msg, data) {
    return new Promise((resolve, reject) => {
      try {
        this._socket.emit(msg, data, resolve);
        this._socket.once('error', reject);
      }
      catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Send data to remote end.
   * 
   * NOTE: This uses `engine.io`'s serialization, followed by processing in `ws`.
   * @see https://github.com/socketio/engine.io-parser/blob/master/lib/index.js#L55
   */
  async sendOne(data) {
    if (!this._socket) {
      this._connect();
    }
    else if (this.isReady()) {
      ++this._sending;
      try {
        // (${Math.round(JSON.stringify(data).length / 1000)} kb)
        if (Verbose) {
          debug(`<- data (n = ${getDataCount(data).toLocaleString('en-us')}): ` +
            Object.entries(data)
              .map(([key, arr]) => {
                try {
                  return `${arr.length} ${key} (${minBy(arr, entry => entry._id)?._id}~${maxBy(arr, entry => entry._id)?._id})`;
                }
                catch (err) {
                  const idx = arr?.findIndex?.(x => x === null || x === undefined);
                  logError(`invalid data key "${key}": "${err.message}". Index #${idx} is ${arr?.[idx]} (${arr})`);
                  return `(invalid data key "${key}")`;
                }
              })
              .join(', ')
          );
        }

        await this.sendWithAck('data', data);
      }
      finally {
        --this._sending;
      }

      return true;
    }
    return false;
  }

  async _onSendFinish() {
    await sleep(SleepDelay);
    if (this.hasFinished()) {
      // finished sending data
      this._refreshInactivityTimer();
      this._waitingCb?.();
    }
  }

  /**
   * Tell SendQueue to start a new buffer.
   */
  bufferBreakpoint() {
    this._sendQueue.bufferBreakpoint();
  }

  // ###########################################################################
  // connect
  // ###########################################################################

  _connect() {
    // future-work: make port configurable
    this._connectStart = Date.now();
    const port = DefaultPort;
    const Remote = `ws://localhost:${port}`;
    const socket = this._socket = io.connect(Remote, {
      // jsonp: false,
      // forceNode: true,
      // port: DefaultPort,
      transports: ['websocket'],

      // fixes seemingly immediate disconnects - see https://stackoverflow.com/a/40993490
      //  longer explanations: https://stackoverflow.com/questions/28238628/socket-io-1-x-use-websockets-only/28240802#28240802
      upgrade: false,

      /**
       * @see https://socket.io/docs/v4/custom-parser#The-msgpack-parser
       */
      parser: msgpackParser
    });
    Verbose && debug('<- connecting...');

    // on reconnection, reset the transports option
    // -> because the Websocket
    //  connection may have failed (caused by proxy, firewall, browser, ...)
    socket.on('reconnect_attempt', () => {
      Verbose && debug('<- reconnecting...');
      // socket.io.opts.transports = ['websocket'];
    });

    socket.on('connect', this._handleConnect.bind(this, socket));
    socket.on('connect_error', this._handleConnectFailed);
    socket.on('disconnect', this._handleDisconnect);
    socket.on('error', this._handleError);
  }

  // ###########################################################################
  // auto-disconnect regularly, so program won't run forever
  // ###########################################################################

  _refreshInactivityTimer() {
    if (StayAwake || !this._ready) {
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

  async waitForQueue() {
    // debug('waitForQueue waiting...');
    return new Promise(resolve => {
      this._waitingCb = () => {
        // debug('  waitForQueue resolve.');
        resolve();
      };
    });
  }
}
