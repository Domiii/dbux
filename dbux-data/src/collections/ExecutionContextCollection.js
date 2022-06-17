import ExecutionContextType, { isAsyncResumeType } from '@dbux/common/src/types/constants/ExecutionContextType';
import StaticContextType from '@dbux/common/src/types/constants/StaticContextType';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import ExecutionContext from '@dbux/common/src/types/ExecutionContext';
import Trace from '@dbux/common/src/types/Trace';
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

  addEntry(entry) {
    super.addEntry(entry);
    if (entry) {
      entry.applicationId = this.dp.application.applicationId;
    }
  }

  _addParamInput(paramTraceId, inputNodeId) {
    const paramDataNodes = this.dp.util.getDataNodesOfTrace(paramTraceId);

    if (paramDataNodes?.length) {
      // NOTE: a param should have exactly one DataNode
      paramDataNodes[0].inputs = [inputNodeId];
    }
  }

  /**
   * Hook up array HOFs via dp.indexes.executionContexts.byCallerTrace.getById().
   * @param {Trace} hofCallTrace 
   */
  resolveBuiltInHOFParamDataNodes(hofCallTrace) {
    const { dp: { util } } = this;
    const callId = hofCallTrace.traceId;
    const contexts = this.dp.indexes.executionContexts.byCallerTrace.get(callId);
    const arrayReadNodes = this.dp.indexes.dataNodes.byTrace.get(callId);

    if (contexts) {
      for (let i = 0; i < contexts.length; ++i) {
        const { contextId } = contexts[i];
        const paramTraces = util.getTracesOfRealContextAndType(contextId, TraceType.Param);
        if (!paramTraces.length) {
          // function has no parameters -> nothing to do
          continue;
        }

        // add to `Param` trace's `inputs`
        const paramTrace = paramTraces[0];
        const inputNode = arrayReadNodes[i];
        if (!inputNode) {
          // this parameter did not have a corresponding argument
          //    (something must have gone wrong here)
          continue;
        }

        this._addParamInput(paramTrace.traceId, inputNode.nodeId);
      }
    }
  }

  /**
   * NOTE: This will execute before `DataNodeCollection.postIndexRaw`
   */
  postIndexRaw(entries) {
    this.errorWrapMethod('setParamInputs', entries);
    // this.errorWrapMethod('setAsyncPromiseIds', entries);
    this.errorWrapMethod('setCallExpressionReturnedInputs', entries);
  }

  /**
   * Link args → params.
   * Set Param trace `inputs` to each arg's `[argNodeId]`.
   * NOTE: for linking input of monkey-patched builtin calls, consider {@link TraceCollection#resolveMonkeyParams}.
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

      // TODO: fix async functions (parameters are in first virtual child, but args belong to parent)

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
        if (!argDataNode) {
          // NOTE: this parameter did not have a corresponding argument
          continue;
        }
        else {
          this._addParamInput(paramTrace.traceId, argDataNode.nodeId);
        }
      }

      // TODO: `RestElement`
    }
  }

  // /**
  //  * Set promiseId for async function contexts.
  //  */
  // setAsyncPromiseIds(contexts) {
  //   const { dp, dp: { util } } = this;
  //   for (const context of contexts) {
  //     const { contextId, contextType } = context;
  //     const { isInterruptable } = util.getContextStaticContext(contextId);

  //     if (isAsyncResumeType(contextType)) {
  //       const returnRef = util.getReturnValueRefOfContext(contextId);
  //       const returnedPromiseRef = returnRef?.refId && util.getPromiseValueRef(returnRef.refId);
  //       // returnedPromiseRef.
  //       // TODO: old idea
  //       //    -> store `nestedByPromiseId` with `DataNode`
  //       //    -> add `nestedByPromiseId` index for promise `DataNode`
  //       //    -> also add support for Request.resolve(promise)
  //       //    -> use `getNestedPromiseId` to get return value promise of `async` function's `context.asyncPromiseId`
  //       //    -> add "same root" constraint
  //     }
  //     else if (isInterruptable) {
  //       const callTrace = dp.util.getCallerTraceOfContext(contextId);
  //       const callResultTrace = callTrace && dp.util.getValueTrace(callTrace.traceId);
  //       const refId = callResultTrace && dp.util.getTraceRefId(callResultTrace.traceId);
  //       const promiseId = refId && dp.util.getPromiseIdOfValueRef(refId);
  //       context.asyncPromiseId = promiseId || 0;
  //     }
  //   }
  // }

  /**
   * Set CallExpression result trace `inputs` to:
   * 1. `[returnNodeId]` if context was recorded
   */
  setCallExpressionReturnedInputs(contexts) {
    const { dp, dp: { util } } = this;
    for (const { contextId } of contexts) {
      const returnTrace = util.getReturnTraceOfContext(contextId);
      if (returnTrace) {
        // 1. recorded context
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