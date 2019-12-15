

export default class ExecutionContext {
  /**
   * @return {ExecutionContext}
   */
  static allocate(contextType, contextId, programId, staticContextId, orderId, schedulerId) {
    // TODO: use object pooling
    const context = new ExecutionContext();
    context._init(contextType, contextId, programId, staticContextId, orderId, schedulerId);
    return context;
  }

  _init(contextType, contextId, programId, staticContextId, orderId, schedulerId) {
    this.contextType = contextType;
    this.programId = programId;
    this.staticContextId = staticContextId;
    this.schedulerId = schedulerId;
    this.orderId = orderId;
    this.contextId = contextId;
    this.createdAt = performance.now();
    this.linkCount = 0;
    this.rootContextId = 0;
  }

  setRoot(rootContextId) {
    this.rootContextId = rootContextId;
  }
}