import StaticContextType from '@dbux/common/src/types/constants/StaticContextType';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import ExecutionContext from '@dbux/common/src/types/ExecutionContext';
import Collection from '../Collection';

/** @typedef { import("./TraceCollection").default } TraceCollection */

/**
 * @extends {Collection<ExecutionContext>}
 */
export default class ExecutionContextCollection extends Collection {
  constructor(dp) {
    super('executionContexts', dp);
    this.currentThreadCount = 1;
  }

  add(entries) {
    for (const entry of entries) {
      // if (!entry.parentContextId) {
      //   // set applicationId, so we can trace any data point back to it's application
      //   entry.applicationId = this.dp.application.applicationId;
      // }

      entry.applicationId = this.dp.application.applicationId;
    }
    super.add(entries);
  }

  /**
   * NOTE: This will execute before `DataNodeCollection.postIndexRaw`
   */
  postIndexRaw(entries) {
    this.errorWrapMethod('setParamInputs', entries);
    this.errorWrapMethod('setAsyncPromiseIds', entries);
    this.errorWrapMethod('setCallExpressionResultInputs', entries);
  }

  /**
   * Set Param trace `inputs` to `[argNodeId]`.
   * NOTE: for linking input of monkey-patched builtin calls, consider {@link TraceCollection#resolveMonkeyCalls}.
   */
  setParamInputs(contexts) {
    const { dp: { util } } = this;
    for (const { contextId } of contexts) {
      const paramTraces = util.getTracesOfContextAndType(contextId, TraceType.Param);
      if (!paramTraces.length) {
        // function has no parameters -> nothing to do
        continue;
      }
      const bceTrace = util.getOwnCallerTraceOfContext(contextId); // BCE
      if (!bceTrace) {
        // no BCE -> must be root context (not called by us) -> nothing to do
        continue;
      }
      const callId = bceTrace.traceId;
      if (!bceTrace.data) {
        // TODO: odd bug
        this.logger.warn(`bceTrace.data is missing in "setParamInputs" for trace "${util.makeTraceInfo(callId)}"`);
        continue;
      }

      // get `argDataNodes` (flattened, in case of spread)
      const argDataNodes = this.dp.util.getCallArgDataNodes(callId);

      // add to `Param` trace's `inputs`
      for (let i = 0; i < paramTraces.length; i++) {
        const paramTrace = paramTraces[i];
        const argDataNode = argDataNodes[i];
        if (argDataNode) {
          const paramDataNodes = util.getDataNodesOfTrace(paramTrace.traceId);
          paramDataNodes[0].inputs = [argDataNode.nodeId];
        }
        else {
          // NOTE: this parameter did not have a corresponding argument
        }
      }

      // TODO: `RestElement`
    }
  }

  /**
   * 
   */
  setAsyncPromiseIds(contexts) {
    const { dp, dp: { util } } = this;
    for (const context of contexts) {
      const { contextId } = context;
      const { type, isInterruptable } = util.getContextStaticContext(contextId);
      // future-work: make sure, this is not called on generator functions
      
      if (StaticContextType.is.Resume(type)) {
        const returnRef = util.getReturnValueRefOfContext(contextId);
        const returnedPromiseRef = returnRef?.refId && util.getPromiseValueRef(returnRef.refId);
        // returnedPromiseRef.
        // TODO: store `nestedByPromiseId` with `DataNode`
        //    -> add `nestedByPromiseId` index for promise `DataNode`
        //    -> implement `getNestingPromiseId` + `getNestedPromiseId`
        //        -> what if multiple promises are nesting or nested?
        //    -> also add support for Request.resolve(promise)
        //    -> use `getNestedPromiseId` to get return value promise of `async` function's `context.asyncPromiseId`
        //    -> seperately add "same root" constraint
      }
      else if (isInterruptable) {
        const callTrace = dp.util.getCallerTraceOfContext(contextId);
        const callResultTrace = callTrace && dp.util.getValueTrace(callTrace.traceId);
        const refId = callResultTrace && dp.util.getTraceRefId(callResultTrace.traceId);
        const promiseId = refId && dp.util.getPromiseIdOfValueRef(refId);
        context.asyncPromiseId = promiseId || 0;
      }
    }
  }

  /**
   * Set CallExpression result trace `inputs` to `[returnNodeId]`.
   */
  setCallExpressionResultInputs(contexts) {
    const { dp, dp: { util } } = this;
    for (const { contextId } of contexts) {
      const returnTrace = util.getReturnValueTraceOfContext(contextId);
      if (!returnTrace) {
        // function has no return value -> nothing to do
        continue;
      }

      const realContextId = util.getRealContextIdOfContext(contextId);
      const bceTrace = util.getOwnCallerTraceOfContext(realContextId); // BCE
      if (!bceTrace) {
        // no BCE -> must be root context (not called by us) -> nothing to do
        continue;
      }
      const cerTrace = dp.collections.traces.getById(bceTrace.resultId);

      if (!cerTrace) {
        // NOTE: function was called, but did not have CER. Possible due to exceptions etc.
      }
      else {
        const cerDataNode = dp.collections.dataNodes.getById(cerTrace.nodeId);
        cerDataNode.inputs = [returnTrace.nodeId];
      }
    }
  }

  // /**
  //  * @param {ExecutionContext[]} contexts 
  //  */
  // postIndex(contexts) {
  //   try {
  //     // determine last trace of every context
  //     this.resolveLastTraceOfContext(contexts);
  //   }
  //   catch (err) {
  //     logError('resolveLastTraceOfContext failed', err); //contexts);
  //   }
  // }

  // resolveLastTraceOfContext() {
  //   // TODO
  //   // return !isReturnTrace(traceType) && !isTracePop(traceType) &&   // return and pop traces indicate that there was no error in that context
  //   //   dp.util.isLastTraceInContext(traceId) &&        // is last trace we have recorded
  //   //   !dp.util.isLastTraceInStaticContext(traceId);   // but is not last trace in the code
  // }
}