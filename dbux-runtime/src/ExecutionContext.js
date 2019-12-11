

export default class ExecutionContext {
  constructor(staticContextId, schedulerId, contextId, stack) {
    this._staticContextId = staticContextId;
    this._schedulerId = schedulerId;
    this._contextId = contextId;
    this._stack = stack;
  }

  getStack() {
    return this._stack;
  }
  
  /**
   * 
   */
  isImmediateInvocation() {
    return !this._schedulerId;
  }
}