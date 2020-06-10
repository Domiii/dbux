import { newLogger } from 'dbux-common/src/log/logger';
import { isTracePush, isTracePop } from 'dbux-common/src/core/constants/TraceType';
import EmptyArray from 'dbux-common/src/util/EmptyArray';
import last from 'lodash/last';
import DataProvider from '../DataProvider';
import { binarySearchByKey } from '../../../dbux-common/src/util/arrayUtil';

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

  getPreviousInContext(traceId) {
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

  getNextInContext(traceId) {
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

  getPreviousParentContext(traceId) {
    const trace = this.dp.collections.traces.getById(traceId);
    const { contextId } = trace;
    const firstTrace = this.dp.util.getFirstTraceOfContext(contextId);

    if (trace !== firstTrace) {
      return firstTrace;
    }
    else {
      return this._getParentTraceByContextId(contextId) || null;
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
      if (parentTrace) return this.getNextInContext(parentTrace.traceId);
      else return null;
    }
  }

  getPreviousChildContext(traceId) {
    const trace = this.dp.collections.traces.getById(traceId);
    const prevChild = this._getPreviousChildTrace(traceId);

    if (trace !== prevChild) {
      return prevChild;
    }
    else {
      const children = this.dp.indexes.traces.byParentTrace.get(prevChild.resultCallId) || EmptyArray;
      if (children.length) return last(children);
      else return null;
    }
  }

  getNextChildContext(traceId) {
    const trace = this.dp.collections.traces.getById(traceId);
    const nextChild = this._getNextChildTrace(traceId);

    if (trace !== nextChild) {
      return nextChild;
    }
    else {
      const children = this.dp.indexes.traces.byParentTrace.get(traceId) || EmptyArray;
      if (children.length) return children[0];
      else return null;
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
  _getPreviousChildTrace(traceId) {
    const realContextId = this.dp.util.getRealContextId(traceId);
    const trace = this.dp.collections.traces.getById(traceId);
    const parentTraces = this.dp.indexes.traces.parentsByRealContext.get(realContextId) || EmptyArray;

    const lowerIndex = this._binarySearchLowerIndexByKey(parentTraces, trace, (t) => t.traceId);

    if (lowerIndex === null) return null;
    else {
      // return if lastResult exist, or getNextTrace of lastParentTrace
      const previousParentTraceId = parentTraces[lowerIndex].traceId;
      const lastResultTrace = this.dp.util.getCallResultTrace(previousParentTraceId);
      return lastResultTrace || this.getNextInContext(previousParentTraceId);
    }
  }

  _getNextChildTrace(traceId) {
    const realContextId = this.dp.util.getRealContextId(traceId);
    const trace = this.dp.collections.traces.getById(traceId);
    const parentTraces = this.dp.indexes.traces.parentsByRealContext.get(realContextId) || EmptyArray;

    const upperIndex = this._binarySearchUpperIndexByKey(parentTraces, trace, (t) => t.traceId);

    if (upperIndex === null) return null;
    else return parentTraces[upperIndex];
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

    if (arr[start] >= x) return null;

    while (start < end) {
      mid = Math.ceil((start + end) / 2);
      if (arr[mid] < x) start = mid;
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
}