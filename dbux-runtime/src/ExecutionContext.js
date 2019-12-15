

export default class ExecutionContext {
  _init(contextType, contextId, programId, staticContextId, orderId, schedulerId) {
    this._contextType = contextType;
    this._programId = programId;
    this._staticContextId = staticContextId;
    this._schedulerId = schedulerId;
    this._orderId = orderId;
    this._contextId = contextId;
    this._createdAt = performance.now();
    this._linkCount = 0;
  }

  getContextType() {
    return this._contextType;
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
}