import TraceLog from './TraceLog';

export default class ExecutionStack {
  _contexts = [];

  constructor(startId) {
    this._startId = startId;
    this._log = new TraceLog(startId);
  }

  peek() {
    if (!this._contexts.length)
      return null;
    return this._contexts[this._contexts.length-1];
  }

  push(context) {
    this._contexts.push(context);
    this._log.logPush(context);
  }

  pop(context) {
    this._log.logPop(context);
  }
}