import TraceLog from './TraceLog';
import ExecutionContextManager from './ExecutionContextManager';

export default class ExecutionStack {
  /**
   * @type {ExecutionContext[]}
   */
  _contexts = [];
  _ptr = 0;

  constructor(rootContextId, schedulerId, parent) {
    this._parent = parent;
    this._schedulerId = schedulerId;
    this._rootContextId = rootContextId;
  }

  /**
   * NOTE: The root context id uniquely identifies this stack.
   */
  getId() {
    return this._rootContextId;
  }

  /**
   * Get last pushed context
   */
  peek() {
    if (!this._contexts.length)
      return null;
    return this._contexts[this._contexts.length-1];
  }

  getActiveCount() {
    return this._contexts.length;
  }

  /**
   * @param {ExecutionContext} context 
   */
  push(contextId) {
    this._contexts.push(contextId);
    ++this._ptr;
  }

  /**
   * @param {ExecutionContext} context
   */
  pop(context) {
    if (this.peek() !== context) {
      TraceLog.instance().logInternalError('Tried to pop context from stack that was not at its top:\n    ', context, 'from', this);
    }
    else {
      // this._contexts.pop();
      --this._ptr;
    }
  }
}