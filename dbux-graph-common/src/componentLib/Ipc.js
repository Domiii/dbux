import { newLogger } from 'dbux-common/src/log/logger';

const { log, debug, warn, error: logError } = newLogger('graph-common/ipc');

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
  calls = {};

  constructor(ipcAdapter, commands) {
    this.ipcAdapter = ipcAdapter;
    this.commands = commands;
    ipcAdapter.onMessage(this.handleMessage);
  }

  postMessage(msg) {
    this.ipcAdapter.postMessage(msg);
  }

  async sendMessage(commandName, componentId, args) {
    const callId = ++this.lastCallId;

    const msg = {
      dbuxCallId: callId,
      dbuxComponentId: componentId,
      dbuxRequest: commandName,
      args
    };

    this.postMessage(msg);

    const call = this.calls[callId] = new IpcCall(callId);
    const result = await call.promise;

    return result;
  }

  processReply(status, callId, result) {
    const call = this.calls[callId];
    if (!call) {
      logError('Received invalid callId - does not exist:', callId);
      return;
    }

    this.calls[callId] = null;  // reset call

    if (status === 'resolve') {
      call.resolve(result);
    }
    else {
      call.reject(new Error(result));
    }
  }

  replyToCall(status, callId, componentId, result) {
    this.postMessage({
      dbuxCallId: callId,
      dbuxComponentId: componentId,
      result,
      status
    });
  }

  handleMessage = async evt => {
    const {
      dbuxCallId: callId,
      dbuxComponentId: componentId,
      dbuxRequest: commandName
    } = evt.data;

    if (!callId) {
      // sometimes other libraries, browser internals or extensions send messages that we do not want to handle
      return;
    }

    if (!commandName) {
      // received reply to our own request
      const { status, result } = evt.data;
      this.processReply(status, callId, result);
    }
    else {
      // new request from remote
      const {
        args
      } = evt.data;
      try {
        const func = this.commands[commandName];
        if (!func) {
          logError('IPC Command does not exist:', commandName);
        }
        else {
          const res = await func(...args);
          this.replyToCall('resolve', callId, componentId, res);
        }
      }
      catch (err) {
        logError('Failed to execute command:', commandName, args, err);
        this.replyToCall('reject', callId, componentId, err.message);
      }
    }
  }
}