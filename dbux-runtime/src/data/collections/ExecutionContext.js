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
  static allocate(contextType, contextId, programId, staticContextId, orderId, rootContextId) {
    // TODO: use object pooling
    const context = new ExecutionContext();
    context._init(contextType, contextId, programId, staticContextId, orderId, rootContextId);
    return context;
  }

  _init(contextType, contextId, programId, staticContextId, orderId, rootContextId) {
    this.contextType = contextType;
    this.programId = programId;
    this.staticContextId = staticContextId;
    this.orderId = orderId;
    this.contextId = contextId;
    // this.createdAt = _performance.now();
    this.rootContextId = rootContextId;
    this.linkCount = 0;
  }
}