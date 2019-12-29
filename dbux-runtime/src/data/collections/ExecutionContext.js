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
  static allocate(contextType, stackDepth, contextId, programId, staticContextId, orderId, parentScopeContextId, schedulerId) {
    // TODO: use object pooling
    const context = new ExecutionContext();
    context._init(contextType, stackDepth, contextId, programId, staticContextId, orderId, parentScopeContextId, schedulerId);
    return context;
  }

  _init(contextType, stackDepth, contextId, programId, staticContextId, orderId, parentScopeContextId, schedulerId) {
    this.contextType = contextType;
    this.stackDepth = stackDepth;
    this.contextId = contextId;
    this.programId = programId;
    this.staticContextId = staticContextId;
    this.orderId = orderId;
    // this.createdAt = _performance.now();
    this.parentScopeContextId = parentScopeContextId;
    this.schedulerId = schedulerId;
  }

  /**
   * This is probably not necessary.
   * We can also find all children by searching for all contexts whose `schedulerId` equals this' `contextId`.
   */
  // addScheduledChild(scheduledContextId) {
  //   // this.scheduledChildren = this.scheduledChildren || [];
  //   // this.scheduledChildren.push(scheduledContextId);
  // }
}