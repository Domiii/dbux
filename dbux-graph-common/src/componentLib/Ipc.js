import get from 'lodash/get';
import { newLogger, logDebug } from '@dbux/common/src/log/logger';
import { makeDebounce } from '@dbux/common/src/util/scheduling';
import MessageType from './MessageType';
import ComponentEndpoint from './ComponentEndpoint';

const Verbose = false;
// const Verbose = true;

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('dbux-graph-common/ipc');

class IpcCall {
  promise;
  resolve;
  reject;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

export default class Ipc {
  ipcAdapter;
  lastCallId = 0;
  calls = new Map();

  constructor(ipcAdapter, componentManager) {
    this.ipcAdapter = ipcAdapter;
    this.componentManager = componentManager;
    ipcAdapter.onMessage(this._handleMessage);
  }

  // ###########################################################################
  // Public methods
  // ###########################################################################

  async sendMessage(componentId, commandName, args) {
    args = this._encodeValues(args);
    const msg = {
      messageType: MessageType.Request,
      componentId,
      commandName,
      args
    };

    return this._sendMessageRaw(msg);
  }

  // ###########################################################################
  // Internal: sending + handling messages
  // ###########################################################################

  async _sendInit(msg) {
    msg.messageType = MessageType.InitComponent;
    return this._sendMessageRaw(msg);
  }

  async _sendPing() {
    const msg = {};
    msg.messageType = MessageType.Ping;
    return this._sendMessageRaw(msg);
  }

  /**
   * Send out a request.
   */
  async _sendMessageRaw(msg) {
    const callId = msg.callId = ++this.lastCallId;

    this._postMessage(msg);

    const call = new IpcCall(callId);
    this.calls.set(callId, call);
    const result = await call.promise;

    return result;
  }

  /**
   * Send back reply (after having received request).
   */
  _sendReply(status, callId, componentId, result) {
    this._postMessage({
      messageType: MessageType.Reply,
      callId,
      componentId,
      result,
      status
    });
  }

  _handleProcessingError(message, err) {
    const {
      callId,
      componentId,
      commandName,
      args
    } = message;

    const info = 'Error when processing request - ';

    
    // eslint-disable-next-line no-console
    this.ipcAdapter.onError(info + commandName, args, err.stack);
    this._sendReply('reject', callId, componentId, info + err.message);
  }

  // ###########################################################################
  // process request + reply
  // ###########################################################################

  _componentIdentifier = 'b,GZ5s2Nq}+p.:7,componentId';

  _encodeValue(value) {
    if (value instanceof ComponentEndpoint) {
      return {
        [this._componentIdentifier]: value.componentId
      };
    }
    return value;
  }

  _decodeValue(value) {
    const componentId = value?.[this._componentIdentifier];
    if (componentId) {
      return this.componentManager.getComponent(componentId);
    }
    return value;
  }

  _encodeValues(values) {
    return values.map(val => this._encodeValue(val));
  }

  _decodeValues(values) {
    return values.map(val => this._decodeValue(val));
  }

  async _processRequest(message) {
    const {
      callId,
      componentId,
      commandName,
      args
    } = message;

    try {
      const endpoint = this.componentManager.getComponent(componentId);
      if (!endpoint) {
        logError(`Received invalid request: componentId is not registered: ${componentId} - command="${commandName}", args="${JSON.stringify(args)}"`);
        return;
      }
      const func = get(endpoint, commandName);
      if (!func) {
        endpoint.logger.error('IPC Command does not exist on endpoint:', commandName);
        return;
      }
      else {
        const decodedArgs = this._decodeValues(args);
        const res = await func.apply(endpoint, decodedArgs);
        const encodedResult = this._encodeValue(res);
        this._sendReply('resolve', callId, componentId, encodedResult);
      }
    }
    catch (err) {
      this._handleProcessingError(message, err);
    }
  }

  /**
   * Handle reply and notify original caller (after having received reply)
   */
  _processReply(message) {
    const {
      callId,
      status,
      result
    } = message;

    const call = this.calls.get(callId);
    if (!call) {
      logError('Received invalid reply - callId does not exist:', callId, JSON.stringify(message));
      return;
    }

    this.calls.set(callId, null);  // reset call

    if (status === 'resolve') {
      const decodedResult = this._decodeValue(result);
      call.resolve(decodedResult);
    }
    else {
      call.reject(new Error(result));
    }
  }

  // ###########################################################################
  // IPCAdapter interface
  // ###########################################################################

  // _postMessage = makeDebounce((msg) => {
  //   this.ipcAdapter.postMessage(msg);
  // }, 0);

  _postMessage = (msg) => {
    Verbose && debug('postMessage', JSON.stringify(msg));
    this.ipcAdapter.postMessage(msg);
  }

  _handleMessage = async msg => {
    if (!msg) {
      return;
    }

    const {
      messageType,
      callId
    } = msg;

    if (!callId || !messageType) {
      // sometimes other libraries, browser internals or extensions send messages that we do not want to handle
      return;
    }

    Verbose && debug('_handleMessage', JSON.stringify(msg));

    const handler = this._messageHandlers[messageType];
    if (!handler) {
      logError('Could not handle message. Unregistered messageType - ' + messageType);
    }

    handler.call(this, msg);
  }

  // ###########################################################################
  // Message handlers
  // ###########################################################################

  _messageHandlers = {
    // [MessageType.InitComponent](message) {
    //   const {
    //     callId
    //   } = message;

    //   this.componentManager.initComponent();

    //   th
    // },

    async [MessageType.Request](message) {
      // new request from remote
      this._processRequest(message);
    },

    [MessageType.Reply](message) {
      // received reply to our own request
      this._processReply(message);
    },

    [MessageType.Ping](/* message */) {
      this.componentManager.handlePing();
    }
  }
}