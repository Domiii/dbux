

export default class ExecutionContext {
  /**
   * @return {ExecutionContext}
   */
  static allocate(contextType, contextId, programId, staticContextId, orderId, schedulerId, rootContextId) {
    // TODO: use object pooling
    const context = new ExecutionContext();
    context._init(contextType, contextId, programId, staticContextId, orderId, schedulerId, rootContextId);
    return context;
  }

  _init(contextType, contextId, programId, staticContextId, orderId, schedulerId, rootContextId) {
    this.contextType = contextType;
    this.programId = programId;
    this.staticContextId = staticContextId;
    this.schedulerId = schedulerId;
    this.orderId = orderId;
    this.contextId = contextId;
    this.createdAt = performance.now();
    this.rootContextId = rootContextId;
    this.linkCount = 0;
  }
}