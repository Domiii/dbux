let _performance;

if (typeof window !== 'undefined') {
  _performance = performance;
}
else {
  _performance = eval("require('perf_hooks').performance");
}

export default class ExecutionContext {
  /**
   * @return {ExecutionContext}
   */
  static allocate(contextType, contextId, programId, staticContextId, orderId, rootContextId, schedulerId) {
    // TODO: use object pooling
    const context = new ExecutionContext();
    context._init(contextType, contextId, programId, staticContextId, orderId, rootContextId, schedulerId);
    return context;
  }

  _init(contextType, contextId, programId, staticContextId, orderId, rootContextId, schedulerId) {
    this.contextType = contextType;
    this.programId = programId;
    this.staticContextId = staticContextId;
    this.orderId = orderId;
    this.contextId = contextId;
    // this.createdAt = _performance.now();
    this.rootContextId = rootContextId;
    this.schedulerId = schedulerId;
    this.scheduledChildren = null;
  }
}