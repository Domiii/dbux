import { newLogger } from 'dbux-common/src/log/logger';
// import Trace from 'dbux-common/src/core/data/Trace';
// import TraceType from 'dbux-common/src/core/constants/TraceType';
// import last from 'lodash/last';
import DataProvider from '../DataProvider';
import TraceType, { isTracePush, isTracePop } from '../../../dbux-common/src/core/constants/TraceType';

const { log, debug, warn, error: logError } = newLogger('CallGraph');

export default class CallGraph {
  _prevParentContext = [];
  _prevInContext = [];
  _prevChildContext = [];
  _nextParentContext = [];
  _nextInContext = [];
  _nextChildContext = [];

  /**
   * @param {DataProvider} dp
   */
  constructor(dp) {
    this.dp = dp;

    // dp._onDataInternal('contexts', this._postAddContexts);
    // dp._onDataInternal('traces', this._postAddAllTraces);
  }

  // ###########################################################################
  //  Public
  // ###########################################################################
  getPreviousInContext(traceId) {
    return this._prevInContext[traceId];
  }

  getNextInContext(traceId) {
    const trace = this.dp.collections.traces.getById(traceId);
    const traces = this.dp.util.getTracesOfRealContext(traceId);
    const index = this._binarySearchByKey(traces, trace, (t) => t.traceId);
    if (!index) {
      logError('Trace not found in traces');
      debugger;
      return null;
    }
    const nextTraceById = this.dp.collections.traces.getById(traceId + 1);

    if (index !== traces.length - 1) {
      return traces[index + 1];
    }
    // handle push/pop siblings
    else if (nextTraceById &&
      isTracePop(this.dp.util.getTraceType(traceId)) &&
      isTracePush(this.dp.util.getTraceType(nextTraceById.traceId))) {
      return nextTraceById;
    }
    else {
      return null;
    }
  }

  getPreviousParentContext(traceId) {
    const trace = this.dp.collections.traces.getById(traceId);
    const { contextId } = trace;
    const firstTrace = this.dp.util.getFirstTraceOfContext(contextId);
    
    if (trace !== firstTrace) {
      return firstTrace;
    }
    else {
      const { parentTraceId } = this.dp.collections.executionContexts.getById(contextId);
      return this.dp.collections.traces.getById(parentTraceId);
    }
  }

  getNextParentContext(traceId) {
    return this._nextParentContext[traceId];
  }

  getPreviousChildContext(traceId) {
    return this._prevChildContext[traceId];
  }

  getNextChildContext(traceId) {
    return this._nextChildContext[traceId];
  }

  // ###########################################################################
  //  Private
  // ###########################################################################

  // _postAddContexts(contexts) {

  // }

  // /**
  //  * @param {Array<Trace>} newTraces 
  //  */
  // _postAddSplitTraces = (newTraces) => {
  //   const tracesByRun = [];
  //   for (const trace of newTraces) {
  //     const { traceId } = trace;
  //     if (!tracesByRun[traceId]) tracesByRun[traceId] = [];
  //     tracesByRun[traceId].push(trace);
  //   }

  //   for (const traces of tracesByRun) {
  //     if (traces) this._postAddTraces(traces);
  //   }
  // }

  // _postAddAllTraces = () => {
  //   this._prevParentContext = [];
  //   this._prevInContext = [];
  //   this._prevChildContext = [];
  //   this._nextParentContext = [];
  //   this._nextInContext = [];
  //   this._nextChildContext = [];
  //   this._postAddTraces(this.dp.collections.traces.getAll().slice(1));
  // }

  // /**
  //  * @param {Array<Trace>} traces 
  //  */
  // _postAddTraces = (traces) => {
  //   let stack: Array<Array<Trace>> = [];
  //   let lastTrace = null;
  //   let lastContext = null;
  //   for (let trace of traces) {
  //     if (!stack.length) {
  //       stack.push([trace]);
  //       lastTrace = trace;
  //       lastContext = this._getContextByTrace(trace);
  //       continue;
  //     }
  //     const context = this._getContextByTrace(trace);
  //     if (context.parentContextId === lastContext.contextId) {
  //       // push
  //       this._processUnassignedTraces(last(stack), trace);
  //       stack.push([trace]);
  //     }
  //     else if (context.contextId === lastContext.parentContextId) {
  //       // pop
  //       const children = stack.pop();
  //       this._processUnassignedTraces(children);
  //       this._assignPrevChildRelation([trace], last(children));
  //       this._assignInContextRelation(last(last(stack)), trace);
  //       this._assignParentRelation(last(last(stack)), trace, children);
  //       last(stack).push(trace);
  //     }
  //     else if (context.contextId === lastContext.contextId) {
  //       // sibling traces
  //       this._assignInContextRelation(last(last(stack)), trace);
  //       last(stack).push(trace);
  //     }
  //     else if (context.parentContextId === lastContext.parentContextId) {
  //       if (context.parentContextId === null) {
  //         // is a new root, push it
  //         this._processUnassignedTraces(last(stack), trace);
  //         stack.push([trace]);
  //       }
  //       else {
  //         // is sibling context (should be pop and push callback)
  //         if (lastTrace.type !== TraceType.PopCallback) {
  //           logError('First of \'sibling context of neighboring traces\' is not popCallback');
  //         }
  //         if (trace.type !== TraceType.PushCallback) {
  //           logError('Second of \'sibling context of neighboring traces\' is not pushCallback');
  //         }

  //         this._assignInContextRelation(last(last(stack)), trace);
  //         last(stack).push(trace);
  //       }
  //     }
  //     else {
  //       // TODO: Some context pop before parent pop(async), need to pop correctly
  //       logError('Neighboring traces having unexpected context relation');
  //     }
  //     lastTrace = trace;
  //     lastContext = context;
  //   }
  // }

  // ########################################
  //  Util
  // ########################################

  // _processUnassignedTraces = (lastStack, newTrace) => {
  //   const unassignedTraces = this._getUnassignedTraces(lastStack);
  //   const lastChild = this._prevChildContext[unassignedTraces[0].traceId];
  //   if (lastChild) this._assignPrevChildRelation(unassignedTraces, lastChild);
  //   if (newTrace) this._assignNextChildRelation(unassignedTraces, newTrace);
  // }

  // /**
  //  * @param {Trace} prevParent
  //  * @param {Trace} nextParent
  //  * @param {Array<Trace>} children
  //  */
  // _assignParentRelation = (prevParent, nextParent, children) => {
  //   const firstChild = children[0];
  //   const lastChild = last(children);
  //   for (let trace of children) {
  //     this._prevParentContext[trace.traceId] = firstChild;
  //     this._nextParentContext[trace.traceId] = lastChild;
  //   }
  //   this._prevParentContext[firstChild.traceId] = prevParent;
  //   this._nextParentContext[lastChild.traceId] = nextParent;
  // }

  // _assignInContextRelation = (trace1, trace2) => {
  //   this._prevInContext[trace2.traceId] = trace1;
  //   this._nextInContext[trace1.traceId] = trace2;
  // }

  // /**
  //  * @param {Array<Trace>} traces
  //  * @param {Trace} nextChild
  //  */
  // _assignPrevChildRelation = (traces, prevChild) => {
  //   const firstTrace = traces[0];
  //   for (let trace of traces) {
  //     this._prevChildContext[trace.traceId] = firstTrace;
  //   }
  //   this._prevChildContext[firstTrace.traceId] = prevChild;
  // }

  // /**
  //  * @param {Array<Trace>} traces
  //  * @param {Trace} nextChild
  //  */
  // _assignNextChildRelation = (traces, nextChild) => {
  //   const lastTrace = last(traces);
  //   for (let trace of traces) {
  //     this._nextChildContext[trace.traceId] = lastTrace;
  //   }
  //   this._nextChildContext[lastTrace.traceId] = nextChild;
  // }

  // /**
  //  * @param {Array<Trace>} traces
  //  */
  // _getUnassignedTraces = (traces) => {
  //   for (let i = traces.length - 1; i >= 0; i--) {
  //     if (this._nextChildContext[traces[i].traceId]) {
  //       return traces.slice(i + 1);
  //     }
  //   }
  //   return traces;
  // }

  /**
   * Note: The array mapped by makeKey must be sorted.
   */
  _binarySearchByKey(arr, x, makeKey) {
    if (makeKey) arr = arr.map(makeKey);
    let start = 0;
    let end = arr.length - 1;
    let mid;

    while (start <= end) {
      mid = Math.floor((start + end) / 2);
      if (arr[mid] === x) return mid;
      else if (arr[mid] < x) start = mid + 1;
      else end = mid - 1;
    }

    // x not in arr
    return null;
  }

  _getContextByTrace = (trace) => {
    return this.dp.collections.executionContexts.getById(trace.contextId);
  }
}