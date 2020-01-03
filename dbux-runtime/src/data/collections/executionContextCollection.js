import Enum from 'dbux-common/src/util/Enum';
import ExecutionContext from './ExecutionContext';
import staticContextCollection from './staticContextCollection';

let _instance;

export const ExecutionContextType = new Enum({
  Immediate: 1,
  ScheduleCallback: 2,
  ExecuteCallback: 3,
  Interrupt: 4,
  Resume: 5
});

export const ExecutionContextUpdateType = new Enum({
  Push: 1
});

export class ExecutionContextCollection {
  _lastContextId = -1;
  _contexts = [null];
  _lastOrderIds = [];

  getContext(contextId) {
    return this._contexts[contextId];
  }


  getStaticContext(contextId) {
    const context = this.getContext(contextId);
    const {
      programId,
      staticContextId
    } = context;
    return staticContextCollection.getContext(programId, staticContextId);
  }

  _genOrderId(programId, staticContextId) {
    const programOrderIds = this._lastOrderIds[programId] || (this._lastOrderIds[programId] = []);
    const orderId = programOrderIds[staticContextId] || (programOrderIds[staticContextId] = 1);
    ++programOrderIds[staticContextId];
    return orderId;
  }

  /**
   * @return {ExecutionContext}
   */
  executeImmediate(stackDepth, programId, staticContextId, parentScopeContextId) {
    const orderId = this._genOrderId(programId, staticContextId);
    const contextId = this._contexts.length;

    const context = ExecutionContext.allocate(
      ExecutionContextType.Immediate, stackDepth, contextId, programId,
      staticContextId, orderId, parentScopeContextId);
    this._push(context);
    return context;
  }

  /**
   * @return {ExecutionContext}
   */
  scheduleCallback(stackDepth, programId, staticContextId, parentScopeContextId, lastPoppedContextId, schedulerId) {
    const orderId = this._genOrderId(programId, staticContextId);
    const contextId = this._contexts.length;

    const context = ExecutionContext.allocate(
      ExecutionContextType.ScheduleCallback, stackDepth, contextId, programId,
      staticContextId, orderId, parentScopeContextId, schedulerId);
    this._push(context);
    return context;
  }

  /**
   * @return {ExecutionContext}
   */
  executeCallback(stackDepth, scheduledContextId, parentScopeContextId) {
    const schedulerContext = this.getContext(scheduledContextId);
    const { programId, staticContextId } = schedulerContext;
    const orderId = this._genOrderId(programId, staticContextId);
    const contextId = this._contexts.length;

    const context = ExecutionContext.allocate(
      ExecutionContextType.ExecuteCallback, stackDepth, contextId, programId,
      staticContextId, orderId, parentScopeContextId, scheduledContextId);
    this._push(context);
    return context;
  }

  await(stackDepth, programId, staticContextId, parentScopeContextId) {
    const orderId = this._genOrderId(programId, staticContextId);
    const contextId = this._contexts.length;

    const context = ExecutionContext.allocate(
      ExecutionContextType.Await, stackDepth, contextId, programId,
      staticContextId, orderId, parentScopeContextId);
    this._push(context);
    return context;
  }

  setContextPopped(contextId) {
    const context = this.getContext(contextId);
    context.isPopped = true;

    this._sendToRemote(contextId, ExecutionContextUpdateType.Pop);
  }

  _push(context) {
    this._contexts.push(context);
    
    this._sendToRemote(context.contextId, ExecutionContextUpdateType.Push, context);
  }

  _sendToRemote(contextId, updateType, state) {
    // TODO: send to remote
  }


  // getTextId(contextId) {
  //   const context = this.getContext(contextId);
  //   const { contextType, programId, staticContextId, orderId, schedulerId} = context;
  //   return `${this._staticContextId}${schedulerId ? `_${schedulerId}` : ''}_${orderId}`;
  // }
}

const executionContextCollection = new ExecutionContextCollection();

export default executionContextCollection;