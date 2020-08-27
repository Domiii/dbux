import last from 'lodash/last';
import { newLogger } from '@dbux/common/src/log/logger';
import { binarySearchByKey } from '@dbux/common/src/util/arrayUtil';
import TraceType, { isTracePush, isTracePop, isDataOnlyTrace } from '@dbux/common/src/core/constants/TraceType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { hasCallId } from '@dbux/common/src/core/constants/traceCategorization';
import DataProvider from '../DataProvider';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('CallGraph');

export default class CallGraph {
  /**
   * @param {DataProvider} dp
   */
  constructor(dp) {
    this.dp = dp;
  }

  // ###########################################################################
  //  Public
  // ###########################################################################

  /**
   * Search algorithm ref.: https://github.com/Domiii/dbux#call-graph-navigation
   */

  getPreviousInContext(traceId, originId = null) {
    if (!originId) {
      originId = traceId;
    }
    const previousTrace = this._getPreviousInContext(traceId);
    if (this._isDataTrace(previousTrace)) {
      if (traceId === previousTrace.traceId) {
        // avoiding endless loop
        logError('Found same trace in `getPreviousInContext`');
        return null;
      }
      return this.getPreviousInContext(previousTrace.traceId, originId);
    }

    if (this._areTraceBCEAndResult(previousTrace.traceId, originId)) {
      return this.getPreviousInContext(previousTrace.traceId, originId);
    }

    return previousTrace;
  }

  getNextInContext(traceId, originId = null) {
    if (!originId) {
      originId = traceId;
    }
    const nextTrace = this._getNextInContext(traceId);
    if (this._isDataTrace(nextTrace)) {
      if (traceId === nextTrace.traceId) {
        // avoiding endless loop
        logError('Found same trace in `getNextInContext`');
        return null;
      }
      return this.getNextInContext(nextTrace.traceId, originId);
    }

    if (this._areTraceBCEAndResult(originId, nextTrace.traceId)) {
      return this.getNextInContext(nextTrace.traceId, originId);
    }

    return nextTrace;
  }

  getPreviousParentContext(traceId) {
    const trace = this.dp.collections.traces.getById(traceId);
    const { contextId } = trace;
    const firstTrace = this.dp.util.getFirstTraceOfContext(contextId);

    if (trace !== firstTrace) {
      return firstTrace;
    }
    else {
      const parentTrace = this._getParentTraceByContextId(contextId);
      if (parentTrace) {
        const callerTrace = this.dp.util.getPreviousCallerTraceOfTrace(parentTrace.traceId);
        return callerTrace || null;
      }
      return null;
    }
  }

  getNextParentContext(traceId) {
    const trace = this.dp.collections.traces.getById(traceId);
    const { contextId } = trace;
    const lastTrace = this.dp.util.getLastTraceOfContext(contextId);

    if (trace !== lastTrace) {
      return lastTrace;
    }
    else {
      const parentTrace = this._getParentTraceByContextId(contextId);
      if (parentTrace) {
        const callerTrace = this.dp.util.getPreviousCallerTraceOfTrace(parentTrace.traceId);
        if (callerTrace) {
          return this.dp.collections.traces.getById(callerTrace.resultId);
        }
      }
      
      return null;
    }
  }

  getPreviousChildContext(traceId) {
    const trace = this.dp.collections.traces.getById(traceId);

    // if trace has callId, `step in` to that call right away
    if (hasCallId(trace)) {
      const children = this.dp.indexes.traces.byCalleeTrace.get(trace.callId) || EmptyArray;
      if (children.length) {
        return last(children);
      }
    }

    // otherwise find the previous child or return null
    const prevChild = this._getPreviousChildTrace(traceId);
    if (!prevChild) {
      // no nextChild
      return null;
    }
    else if (prevChild === trace) {
      // nextChild is itself(usually in getter/setter), return the first child inside
      const children = this.dp.indexes.traces.byCalleeTrace.get(traceId) || EmptyArray;
      if (children.length) {
        return children[0];
      }
      else {
        logError(`PreviousChildContext of traceId=${traceId} does not have any children`);
        return trace;
      }
    }
    else {
      return prevChild;
    }
  }

  getNextChildContext(traceId) {
    const trace = this.dp.collections.traces.getById(traceId);

    // if trace has callId, `step in` to that call right away
    if (hasCallId(trace)) {
      const children = this.dp.indexes.traces.byCalleeTrace.get(trace.callId) || EmptyArray;
      if (children.length) {
        return children[0];
      }
    }

    // otherwise find the next child or return null
    const nextChild = this._getNextChildTrace(traceId);
    if (!nextChild) {
      // no nextChild
      return null;
    }
    else if (nextChild === trace) {
      // nextChild is itself(usually in getter/setter), return the first child inside
      const children = this.dp.indexes.traces.byCalleeTrace.get(traceId) || EmptyArray;
      if (children.length) {
        return children[0];
      }
      else {
        logError(`NextChildContext of traceId=${traceId} does not have any children`);
        return trace;
      }
    }
    else {
      return nextChild;
    }
  }

  getPreviousByStaticTrace(traceId) {
    const trace = this.dp.collections.traces.getById(traceId);
    const traces = this.dp.indexes.traces.byStaticTrace.get(trace.staticTraceId);
    const index = binarySearchByKey(traces, trace, (t) => t.traceId);

    if (index !== null && index > 0) {
      return traces[index - 1];
    }
    else {
      return null;
    }
  }

  getNextByStaticTrace(traceId) {
    const trace = this.dp.collections.traces.getById(traceId);
    const traces = this.dp.indexes.traces.byStaticTrace.get(trace.staticTraceId);
    const index = binarySearchByKey(traces, trace, (t) => t.traceId);

    if (index !== null && index < traces.length - 1) {
      return traces[index + 1];
    }
    else {
      return null;
    }
  }

  // ###########################################################################
  //  Private
  // ###########################################################################
  _getPreviousInContext(traceId) {
    const trace = this.dp.collections.traces.getById(traceId);
    const traces = this.dp.util.getTracesOfRealContext(traceId);
    const index = this._binarySearchByKey(traces, trace, (t) => t.traceId);
    if (index === null) {
      logError('Trace not found in traces');
      debugger;
      return null;
    }
    const previousTraceById = this.dp.collections.traces.getById(traceId - 1);

    if (index !== 0) {
      return traces[index - 1];
    }
    // handle push/pop siblings
    else if (previousTraceById &&
      isTracePush(this.dp.util.getTraceType(traceId)) &&
      isTracePop(this.dp.util.getTraceType(previousTraceById.traceId))) {
      return previousTraceById;
    }
    else {
      return null;
    }
  }

  _getNextInContext(traceId) {
    const trace = this.dp.collections.traces.getById(traceId);
    const traces = this.dp.util.getTracesOfRealContext(traceId);
    const index = this._binarySearchByKey(traces, trace, (t) => t.traceId);
    if (index === null) {
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

  _getPreviousChildTrace(traceId) {
    const trace = this.dp.collections.traces.getById(traceId);
    const realContextId = this.dp.util.getRealContextId(traceId);
    const parentTraces = this.dp.indexes.traces.parentsByRealContext.get(realContextId) || EmptyArray;

    const lowerIndex = this._binarySearchLowerIndexByKey(parentTraces, trace, (t) => t.traceId);

    if (lowerIndex === null) {
      return null;
    }
    else {
      return this.dp.util.getCallerTraceOfTrace(parentTraces[lowerIndex].traceId);
    }
  }

  _getNextChildTrace(traceId) {
    const realContextId = this.dp.util.getRealContextId(traceId);
    const trace = this.dp.collections.traces.getById(traceId);
    const parentTraces = this.dp.indexes.traces.parentsByRealContext.get(realContextId) || EmptyArray;
    const callerTraces = parentTraces.map(t => this.dp.util.getPreviousCallerTraceOfTrace(t.traceId))
      .sort((t1, t2) => t1.traceId - t2.traceId);

    const upperIndex = this._binarySearchUpperIndexByKey(callerTraces, trace, (t) => t.traceId);

    if (upperIndex === null) {
      return null;
    }
    else {
      return this.dp.util.getCallerTraceOfTrace(callerTraces[upperIndex].traceId);
    }
  }

  // ########################################
  //  Util
  // ########################################

  /**
   * Note: The array mapped by makeKey must be sorted.
   */
  _binarySearchByKey(arr, x, makeKey) {
    if (makeKey) {
      arr = arr.map(makeKey);
      x = makeKey(x);
    }
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

  /**
   * Note: The array mapped by makeKey must be sorted.
   */
  _binarySearchUpperIndexByKey(arr, x, makeKey) {
    if (!arr.length) return null;
    if (makeKey) {
      arr = arr.map(makeKey);
      x = makeKey(x);
    }
    let start = 0;
    let end = arr.length - 1;
    let mid;

    if (arr[end] < x) return null;

    while (start < end) {
      mid = Math.floor((start + end) / 2);
      if (arr[mid] < x) start = mid + 1;
      else end = mid;
    }

    return start;
  }

  _binarySearchLowerIndexByKey(arr, x, makeKey) {
    if (!arr.length) return null;
    if (makeKey) {
      arr = arr.map(makeKey);
      x = makeKey(x);
    }
    let start = 0;
    let end = arr.length - 1;
    let mid;

    if (arr[start] > x) return null;

    while (start < end) {
      mid = Math.ceil((start + end) / 2);
      if (arr[mid] <= x) start = mid;
      else end = mid - 1;
    }

    return start;
  }

  _getParentTraceByContextId = (contextId) => {
    const { parentTraceId } = this.dp.collections.executionContexts.getById(contextId);
    return this.dp.collections.traces.getById(parentTraceId);
  }

  _getContextByTrace = (trace) => {
    return this.dp.collections.executionContexts.getById(trace.contextId);
  }

  _isDataTrace(trace) {
    if (trace && isDataOnlyTrace(this.dp.util.getTraceType(trace.traceId))) {
      return true;
    }
    else {
      return false;
    }
  }

  _areTraceBCEAndResult(traceId1, traceId2) {
    const type1 = this.dp.util.getTraceType(traceId1);
    if (TraceType.is.BeforeCallExpression(type1)) {
      const type2 = this.dp.util.getTraceType(traceId2);
      if (TraceType.is.CallExpressionResult(type2)) {
        const trace1 = this.dp.collections.traces.getById(traceId1);
        const trace2 = this.dp.collections.traces.getById(traceId2);
        if (trace1.callId === trace2.resultCallId) {
          return true;
        }
      }
    }
    return false;
  }
}