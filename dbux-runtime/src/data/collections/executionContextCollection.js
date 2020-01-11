import Enum from 'dbux-common/src/util/Enum';
import ExecutionContextType from 'dbux-common/src/core/constants/ExecutionContextType';
import ExecutionContext from './ExecutionContext';
import staticContextCollection from './staticContextCollection';


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

  getById(contextId) {
    return this._contexts[contextId];
  }


  getStaticContext(contextId) {
    const context = this.getContext(contextId);
    const {
      staticContextId
    } = context;
    return staticContextCollection.getById(staticContextId);
  }

  /**
   * @return {ExecutionContext}
   */
  executeImmediate(stackDepth, programId, inProgramStaticId, parentContextId) {
    return this._create(ExecutionContextType.Immediate,
      stackDepth, programId, inProgramStaticId, parentContextId);
  }

  /**
   * @return {ExecutionContext}
   */
  scheduleCallback(stackDepth, programId, inProgramStaticId, parentContextId, lastPoppedContextId, schedulerId) {
    return this._create(ExecutionContextType.ScheduleCallback,
      stackDepth, programId, inProgramStaticId, parentContextId, schedulerId);
  }

  /**
   * @return {ExecutionContext}
   */
  executeCallback(stackDepth, scheduledContextId, parentContextId) {
    const schedulerContext = this.getContext(scheduledContextId);
    const { staticContextId } = schedulerContext;
    const orderId = this._genOrderId(staticContextId);
    const contextId = this._contexts.length;

    const context = ExecutionContext.allocate(
      ExecutionContextType.ExecuteCallback, stackDepth, contextId,
      staticContextId, orderId, parentContextId, scheduledContextId);
    this._push(context);
    return context;
  }

  await(stackDepth, programId, inProgramStaticId, parentContextId) {
    return this._create(ExecutionContextType.Await,
      stackDepth, programId, inProgramStaticId, parentContextId);
  }

  /**
   * resumedChildren are used in interrupted functions.
   * When coming back after an interruption, a "resume child context" is added.
   * It will be popped: 
   * (1) either when the function pops,
   * (2) or when another interrupt occurs.
   */
  resume(parentContextId, inProgramStaticId, schedulerId, stackDepth) {
    const parentContext = this.getContext(parentContextId);
    const { staticContextId: parenStaticContextId } = parentContext;
    const { programId } = staticContextCollection.getById(parenStaticContextId);
    const context = this._create(ExecutionContextType.Resume,
      stackDepth, programId, inProgramStaticId, parentContextId, schedulerId);

    const { contextId } = context;
    this._addResumedChild(parentContextId, contextId);

    return context;
  }

  // ###########################################################################
  // privat methods
  // ###########################################################################

  _genOrderId(staticId) {
    return this._lastOrderIds[staticId] = (this._lastOrderIds[staticId] || 0) + 1;
  }

  _create(type, stackDepth, programId, inProgramStaticId, parentContextId, schedulerId = null) {
    const { staticId: staticContextId } = staticContextCollection.getContext(programId, inProgramStaticId);
    const orderId = this._genOrderId(staticContextId);
    const contextId = this._contexts.length;

    const context = ExecutionContext.allocate(
      type, stackDepth, contextId, staticContextId, orderId, parentContextId, schedulerId);
    this._push(context);
    return context;
  }

  // ###########################################################################
  // Write functions
  // These functions actually commit to collection/send to remote,
  // using `ExecutionContextUpdateType` semantics.
  // ###########################################################################

  // setContextPopped(contextId) {
  //   const context = this.getContext(contextId);
  //   context.isPopped = true;

  //   this._commitChange(contextId, ExecutionContextUpdateType.Pop);
  // }

  _addResumedChild(parentContextId, contextId) {

    // TODO: this._sendToRemote();
  }

  _push(context) {
    this._contexts.push(context);

    this._commitChange(context.contextId, ExecutionContextUpdateType.Push, context);
  }


  // ###########################################################################
  // Remote
  // ###########################################################################

  _commitChange(contextId, updateType, state) {
    // TODO: batch and then send to remote
  }

}

const executionContextCollection = new ExecutionContextCollection();

export default executionContextCollection;