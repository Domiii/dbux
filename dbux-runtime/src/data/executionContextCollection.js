import Enum from 'dbux-common/src/util/Enum';
import ExecutionContextType from 'dbux-common/src/core/constants/ExecutionContextType';
import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import staticContextCollection from './staticContextCollection';
import Collection from './Collection';
import pools from './pools';


export class ExecutionContextCollection extends Collection {
  _lastContextId = -1;
  _lastOrderIds = [];

  constructor() {
    super('executionContexts');
  }

  getStaticContext(contextId) {
    const context = this.getById(contextId);
    const {
      staticContextId
    } = context;
    return staticContextCollection.getById(staticContextId);
  }

  // Write operations

  /**
   * @return {ExecutionContext}
   */
  executeImmediate(stackDepth, runId, parentContextId, parentTraceId, programId, inProgramStaticId) {
    return this._create(ExecutionContextType.Immediate,
      stackDepth, runId, parentContextId, parentTraceId, programId, inProgramStaticId);
  }

  /**
   * @return {ExecutionContext}
   */
  executeCallback(stackDepth, runId, parentContextId, parentTraceId, schedulerContextId, schedulerTraceId) {
    const schedulerContext = this.getById(schedulerContextId);
    const { staticContextId } = schedulerContext;
    const orderId = this._genOrderId(staticContextId);
    const contextId = this._all.length;

    const context = this._allocate(
      ExecutionContextType.ExecuteCallback, stackDepth, runId, parentContextId, parentTraceId, contextId,
      staticContextId, orderId, schedulerTraceId);
    this._push(context);
    return context;
  }
  
  await(stackDepth, runId, parentContextId, parentTraceId, programId, inProgramStaticId) {
    return this._create(ExecutionContextType.Await,
      stackDepth, runId, parentContextId, parentTraceId, programId, inProgramStaticId);
  }
  
  /**
   * resumedChildren are used in interrupted functions.
   * When coming back after an interruption, a "resume child context" is added.
   * It will be popped: 
   * (1) either when the function pops,
   * (2) or when another interrupt occurs.
   */
  resume(stackDepth, runId, parentContextId, parentTraceId, programId, inProgramStaticId, schedulerTraceId) {
    // const parentContext = this.getById(parentContextId);
    // const { staticContextId: parenStaticContextId } = parentContext;
    // const { programId } = staticContextCollection.getById(inProgramStaticId);
    const context = this._create(ExecutionContextType.Resume,
      stackDepth, runId, parentContextId, parentTraceId, programId, inProgramStaticId, schedulerTraceId);

    return context;
  }

  // ###########################################################################
  // privat methods
  // ###########################################################################

  _genOrderId(staticId) {
    return this._lastOrderIds[staticId] = (this._lastOrderIds[staticId] || 0) + 1;
  }

  _create(type, stackDepth, runId, parentContextId, parentTraceId, programId, inProgramStaticId, schedulerTraceId = null) {
    const staticContext = staticContextCollection.getContext(programId, inProgramStaticId);
    const { staticId: staticContextId } = staticContext;
    const orderId = this._genOrderId(staticContextId);
    const contextId = this._all.length;

    const context = this._allocate(
      type, stackDepth, runId, parentContextId, parentTraceId, contextId, staticContextId, orderId, schedulerTraceId
    );
    this._push(context);
    return context;
  }

  _allocate(contextType, stackDepth, runId, parentContextId, parentTraceId, contextId, staticContextId, orderId, schedulerTraceId) {
    // TODO: use object pooling
    const context = pools.executionContexts.allocate();
    context.contextType = contextType;
    // context.stackDepth = stackDepth;  // not quite necessary, so we don't store it, for now
    context.runId = runId;
    context.parentContextId = parentContextId;
    context.parentTraceId = parentTraceId;
    context.contextId = contextId;
    context.staticContextId = staticContextId;
    context.orderId = orderId;
    context.schedulerTraceId = schedulerTraceId;
    context.createdAt = Date.now();  // { createdAt }
    
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

  _push(context) {
    this._all.push(context);
    this._send(context);
  }
}

const executionContextCollection = new ExecutionContextCollection();

export default executionContextCollection;