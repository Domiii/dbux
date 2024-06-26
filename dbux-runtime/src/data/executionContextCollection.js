import ExecutionContextType, { isRealContextType } from '@dbux/common/src/types/constants/ExecutionContextType';
import ExecutionContext from '@dbux/common/src/types/ExecutionContext';
import staticContextCollection from './staticContextCollection';
import Collection from './Collection';
import pools from './pools';


export class ExecutionContextCollection extends Collection {
  _lastContextId = -1;
  _lastOrderIds = [];

  // _lastTraceIds = [];

  _firstContextChild = new Map();

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

  getProgramId(contextId) {
    const context = this.getById(contextId);
    const {
      staticContextId
    } = context;
    const staticContext = staticContextCollection.getById(staticContextId);
    const {
      programId
    } = staticContext;

    return programId;
  }

  getLastRealContext(lastContextId) {
    if (!lastContextId) {
      this.logger.error(`tried to call getLastRealContext without argument.`);
      return null;
    }
    let lastContext = this.getById(lastContextId);
    if (!lastContext) {
      return null;
    }
    if (lastContext.realContextId) {
      lastContext = this.getById(lastContext.realContextId);
    }
    return lastContext;
  }

  makeContextInfo(contextOrContextId) {
    const context = this.asContext(contextOrContextId);
    if (!context) {
      return `null Context (${contextOrContextId})`;
    }
    const { contextId } = context;
    const { contextType, staticContextId } = context;
    const staticInfo = staticContextCollection.makeStaticContextInfo(staticContextId, false);
    return `[${ExecutionContextType.nameFrom(contextType)}] #${contextId} ${staticInfo}`;
  }
  
  isContextOfStaticContext(contextId, programId, inProgramStaticContextId) {
    const context = this.getById(contextId);
    const staticContextId = staticContextCollection.getStaticContextId(programId, inProgramStaticContextId);
    if (context && staticContextId) {
      return context.staticContextId === staticContextId;
    }
    return false;
  }

  // ###########################################################################
  // Create
  // ###########################################################################

  /**
   * @return {ExecutionContext}
   */
  pushImmediate(stackDepth, runId, parentContextId, parentTraceId, programId, inProgramStaticContextId, definitionTid, tracesDisabled) {
    return this._create(ExecutionContextType.Immediate,
      stackDepth, runId, 0, parentContextId, parentTraceId, programId, inProgramStaticContextId, null, definitionTid, tracesDisabled);
  }

  // /**
  //  * @return {ExecutionContext}
  //  */
  // executeCallback(stackDepth, runId, parentContextId, parentTraceId, schedulerContextId, schedulerTraceId, tracesDisabled) {
  //   const schedulerContext = this.getById(schedulerContextId);
  //   const { staticContextId } = schedulerContext;
  //   const orderId = this._genOrderId(staticContextId);
  //   const contextId = this._all.length;

  //   const context = this._allocate(
  //     ExecutionContextType.ExecuteCallback, stackDepth, runId, parentContextId, parentTraceId, contextId,
  //     staticContextId, orderId, schedulerTraceId, tracesDisabled);
  //   this._pushAndSend(context);
  //   return context;
  // }

  pushAwait(stackDepth, runId, realContextId, parentContextId, parentTraceId, programId, inProgramStaticContextId) {
    const schedulerTraceId = null;
    const definitionTid = null;
    const tracesDisabled = false; // tracing must be enabled if we traced an `await`
    return this._create(ExecutionContextType.Await,
      stackDepth, runId, realContextId, parentContextId, parentTraceId, programId, inProgramStaticContextId, schedulerTraceId, definitionTid, tracesDisabled);
  }

  /**
   * resumedChildren are used in interrupted functions.
   * When coming back after an interruption, a "resume child context" is added.
   * It will be popped: 
   * (1) either when the function pops,
   * (2) or when another interrupt occurs.
   */
  pushResume(contextType, stackDepth, runId, realContextId, parentContextId, parentTraceId, programId, inProgramStaticContextId, schedulerTraceId, definitionTid) {
    // const parentContext = this.getById(parentContextId);
    // const { staticContextId: parenStaticContextId } = parentContext;
    // const { programId } = staticContextCollection.getById(inProgramStaticContextId);
    const context = this._create(contextType,
      stackDepth, runId, realContextId, parentContextId, parentTraceId, programId, inProgramStaticContextId, schedulerTraceId, definitionTid);

    return context;
  }

  asContext(contextOrContextId) {
    let context;
    if (contextOrContextId.contextId) {
      context = contextOrContextId;
    }
    else {
      context = this.getById(contextOrContextId);
    }
    return context;
  }

  debugAddContextDebugData(contextOrContextId, data) {
    const context = this.asContext(contextOrContextId);

    // [edit-after-send]
    Object.assign(context, data);
  }


  // ###########################################################################
  // privat methods
  // ###########################################################################

  _genOrderId(staticId) {
    return this._lastOrderIds[staticId] = (this._lastOrderIds[staticId] || 0) + 1;
  }

  _lastCid;

  _create(type, stackDepth, runId, realContextId, parentContextId, parentTraceId, programId, inProgramStaticContextId, schedulerTraceId, definitionTid, tracesDisabled) {
    const staticContext = staticContextCollection.getContext(programId, inProgramStaticContextId);
    const { staticId: staticContextId } = staticContext;
    const orderId = this._genOrderId(staticContextId);
    const contextId = this._all.length;

    if (contextId > 1 && !this._all[contextId - 1]) {
      this.logger.warn(`ContextId was skipped (${contextId - 1} does not exist; lastCid=${this._lastCid})`);
    }
    this._lastCid = contextId;

    const context = this._allocate(
      type, stackDepth, runId, parentContextId, parentTraceId, contextId, definitionTid, staticContextId, orderId, schedulerTraceId, tracesDisabled
    );
    if (realContextId) {
      context.realContextId = realContextId;
    }
    if (type === 2) {
      this.logger.debug(`[new context] ${this.makeContextInfo(context)}`);
    }
    this._pushAndSend(context);

    // if (!parentContextId || isVirtualRoot) {
    //   this.logger.warn(`CREATE root: ${context.contextId}`, this.makeContextInfo(contextId));
    // }

    if (this._firstContextChild.get(parentContextId) === undefined) {
      this._firstContextChild.set(parentContextId, context.contextId);
    }

    return context;
  }

  _allocate(contextType, stackDepth, runId, parentContextId, parentTraceId, contextId, definitionTid, staticContextId, orderId, schedulerTraceId, tracesDisabled) {
    const context = pools.executionContexts.allocate();
    context.contextType = contextType;
    // context.stackDepth = stackDepth;  // not quite necessary, so we don't store it, for now
    context.runId = runId;
    context.parentContextId = parentContextId;
    context.parentTraceId = parentTraceId;
    context.contextId = contextId;
    context.definitionTid = definitionTid;
    context.staticContextId = staticContextId;
    context.orderId = orderId;
    context.schedulerTraceId = schedulerTraceId;
    context.tracesDisabled = tracesDisabled;
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

  _pushAndSend(context) {
    this.push(context);
    this._send(context);
  }

  // isFirstContextInParent(contextId) {
  //   const context = this.getById(contextId);
  //   if (context) {
  //     const { parentContextId } = context;
  //     if (parentContextId) {
  //       return this._firstContextChild.get(parentContextId) === contextId;
  //     }
  //   }
  //   else {
  //     this.logger.trace(`[isFirstContextInParent] context does not exist - contextId=${contextId}`);
  //   }
  //   return false;
  // }
}

const executionContextCollection = new ExecutionContextCollection();

export default executionContextCollection;