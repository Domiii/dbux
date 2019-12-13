

export default class ExecutionContext {
  constructor(staticContextId, schedulerId, orderId, contextId) {
    this._staticContextId = staticContextId;
    this._schedulerId = schedulerId;
    this._orderId = orderId;
    this._contextId = contextId;
    this._createdAt = performance.now();
  }

  getStaticContextId() {
    return this._staticContextId;
  }

  getContextId() {
    return this._contextId;
  }

  getSchedulerId() {
    return this._contextId;
  }

  // getStack() {
  //   return this._stack;
  // }
  
  /**
   * 
   */
  isImmediateInvocation() {
    return !this._schedulerId;
  }
}