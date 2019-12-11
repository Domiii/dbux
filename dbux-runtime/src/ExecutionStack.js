import TraceLog from './TraceLog';
import ExecutionContext from './ExecutionContext';

export default class ExecutionStack {
  /**
   * @type {ExecutionContext[]}
   */
  _contexts = [];
  _activeCount = 0;

  constructor(rootContextId, parent) {
    this._parent = parent;
    this._log = new TraceLog();
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
    return this._activeCount;
  }

  /**
   * @param {ExecutionContext} context 
   */
  push(context) {
    this._contexts.push(context);
    if (context.isImmediateInvocation()) {
      ++this._activeCount;
    }
  }

  /**
   * @param {ExecutionContext} context
   */
  pop(context) {
    if (this.peek() !== context) {
      this._log.logInternalError('Tried to pop context from stack that was not at its top:\n    ', context, 'from', this);
    }
    else {
      if (context.isImmediateInvocation()) {
        --this._activeCount;
      }
      this._contexts.pop();
    }
  }
}