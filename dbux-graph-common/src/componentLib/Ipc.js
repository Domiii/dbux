import get from 'lodash/get';
import { newLogger } from 'dbux-common/src/log/logger';
import { makeDebounce } from 'dbux-common/src/util/scheduling';
import MessageType from './MessageType';

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

  // _postMessage = makeDebounce((msg) => {
  //   this.ipcAdapter.postMessage(msg);
  // }, 0);

  _postMessage = (msg) => {
    this.ipcAdapter.postMessage(msg);
  }

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
        logError('Received invalid request: componentId is not registered:', componentId);
        return;
      }
      const func = get(endpoint, commandName);
      if (!func) {
        endpoint.logger.error('IPC Command does not exist on endpoint:', commandName);
        return;
      }
      else {
        const res = await func.apply(endpoint, args);
        this._sendReply('resolve', callId, componentId, res);
      }
    }
    catch (err) {
      this._sendReject(message, err);
    }
  }

  _sendReject(message, err) {
    const {
      callId,
      componentId,
      commandName,
      args
    } = message;

    const info = 'Failed to process request - ';
    logError(info + commandName, args);
    logError(err.stack);
    this._sendReply('reject', callId, componentId, info + err.message);
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
      logError('Received invalid callId - does not exist:', callId, JSON.stringify(message));
      return;
    }

    this.calls.set(callId, null);  // reset call

    if (status === 'resolve') {
      call.resolve(result);
    }
    else {
      call.reject(new Error(result));
    }
  }

  // ###########################################################################
  // handleMessage
  // ###########################################################################

  _handleMessage = async message => {
    // debug('received msg', message);
    if (!message) {
      return;
    }

    const {
      messageType,
      callId
    } = message;

    if (!callId || !messageType) {
      // sometimes other libraries, browser internals or extensions send messages that we do not want to handle
      return;
    }

    const handler = this._messageHandlers[messageType];
    if (!handler) {
      logError('Could not handle message. Unregistered messageType - ' + messageType);
    }

    handler.call(this, message);
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

    [MessageType.Ping](message) {
      this.componentManager.handlePing();
    }
  }
}