

export default class ExecutionContext {
  constructor(staticContextId, callerId, contextId) {
    this._staticContextId = staticContextId;
    this._callerId = callerId;
    this._contextId = contextId;
  }
  
  /**
   * 
   */
  isDynamicInvocation() {
    return !!this._callerId;
  }
}