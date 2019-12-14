
let _instance;

export const ContextType = new Enum({
  Immediate: 1,
  Scheduled: 2
});

function newExecutionContext(contextType, contextId, programId, staticContextId, orderId, schedulerId) {
  // TODO: use pool?
  return {
    contextType,
    contextId,
    refCount: 1,
    programId, staticContextId, orderId, schedulerId
  };
}

export default class ExecutionContextManager {
  /**
   * @return {ExecutionContextManager}
   */
  static get instance() {
    return _instance || (_instance = new ExecutionContextManager());
  }

  _lastContextId = -1;
  _contexts = [];

  getContext(contextId) {
    return this._contexts[contextId];
  }

  immediate(programId, staticContextId, orderId) {
    const contextId = ++this._lastContextId;
    this._contexts.push(newExecutionContext(ContextType.Immediate, contextId, programId, staticContextId, orderId));
  }

  schedule(programId, staticContextId, orderId, schedulerId) {
    const contextId = ++this._lastContextId;
    this._contexts.push(newExecutionContext(ContextType.Schedule, contextId, programId, staticContextId, orderId, schedulerId));
  }



  // getTextId(contextId) {
  //   const context = this.getContext(contextId);
  //   const { contextType, programId, staticContextId, orderId, schedulerId} = context;
  //   return `${this._staticContextId}${schedulerId ? `_${schedulerId}` : ''}_${orderId}`;
  // }
}