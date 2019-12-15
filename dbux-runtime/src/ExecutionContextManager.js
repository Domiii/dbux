import StaticContextManager from './StaticContextManager';
// import Enum from '-dbux-common/Enum';
import Enum from 'dbux-common/dist/Enum';
import ExecutionContext from './ExecutionContext';

let _instance;

export const ContextType = new Enum({
  Immediate: 1,
  Scheduled: 2,
  Pause: 3,
  Continue: 4
});

function newExecutionContext(contextType, contextId, programId, staticContextId, orderId, schedulerId) {
  const context = new ExecutionContext();
  context._init(contextType, contextId, programId, staticContextId, orderId, schedulerId);
  return context;
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

  immediate(programId, staticContextId) {
    const orderId = StaticContextManager.instance.genContextId(programId, staticContextId);
    const contextId = ++this._lastContextId;
    this._contexts.push(newExecutionContext(ContextType.Immediate, contextId, programId, staticContextId, orderId));
  }

  schedule(programId, staticContextId, schedulerId) {
    const orderId = StaticContextManager.instance.genContextId(programId, staticContextId);
    const contextId = ++this._lastContextId;
    this._contexts.push(newExecutionContext(ContextType.Schedule, contextId, programId, staticContextId, orderId, schedulerId));
  }



  // getTextId(contextId) {
  //   const context = this.getContext(contextId);
  //   const { contextType, programId, staticContextId, orderId, schedulerId} = context;
  //   return `${this._staticContextId}${schedulerId ? `_${schedulerId}` : ''}_${orderId}`;
  // }
}