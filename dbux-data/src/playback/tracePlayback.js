import NanoEvents from 'nanoevents';
import Trace from 'dbux-common/src/core/data/Trace';
import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import { newLogger } from 'dbux-common/src/log/logger';
import allApplications from '../applications/allApplications';
import traceSelection from '../traceSelection';

const { log, debug, warn, error: logError } = newLogger('PlaybackController');

export class TracePlayback {
  timer = null;
  timerInterval = 1000;
  currentTrace: Trace = null;
  _isPlaying = false;
  _emitter = new NanoEvents();

  /**
   * @param {ApplicationSetData} applicationSetData 
   */
  constructor(applicationSetData) {
    this.applicationSetData = applicationSetData;
    this.applicationSet = applicationSetData.set;
    this.firstTracesInOrder = applicationSetData.firstTracesInOrder;

    this.applicationSet.onApplicationsChanged(this._handleApplicationsChanged);
    traceSelection.onTraceSelectionChanged(this._handleTraceSelectionChanged);
  }

  // ###########################################################################
  // Main play functions (Go-to)
  // ###########################################################################

  play() {
    if (this._isPlaying) return;
    if (!this.currentTrace) this.currentTrace = this._getFirstTraceInOrder();
    this.timer = setInterval(this._onPlay, this.timerInterval);
    this._isPlaying = true;
  }

  pause() {
    if (!this._isPlaying) return;
    clearInterval(this.timer);
    this._isPlaying = false;
    this._emitPause();
  }

  gotoPreviousTrace() {
    if (!this.currentTrace) return;
    this._setTrace(this.getPreviousTrace());
  }

  gotoNextTrace() {
    if (!this.currentTrace) return;
    this._setTrace(this.getNextTrace());
  }

  gotoPreviousInContext() {
    if (!this.currentTrace) return;
    this._setTrace(this.getPreviousInContext());
  }

  gotoNextInContext() {
    if (!this.currentTrace) return;
    this._setTrace(this.getNextInContext());
  }

  gotoPreviousParentContext() {
    if (!this.currentTrace) return;
    this._setTrace(this.getPreviousParentContext());
  }

  gotoNextParentContext() {
    if (!this.currentTrace) return;
    this._setTrace(this.getNextParentContext());
  }

  gotoPreviousChildContext() {
    if (!this.currentTrace) return;
    this._setTrace(this.getPreviousChildContext());
  }

  gotoNextChildContext() {
    if (!this.currentTrace) return;
    this._setTrace(this.getNextChildContext());
  }

  // ###########################################################################
  // Main play functions (Getter)
  // ###########################################################################

  // TODO: fix 'Neighboring traces having non-neighboring contexts.' error  

  getPreviousTrace() {
    const prevTrace = this._getPreviousTraceInApplication(this.currentTrace);
    if (prevTrace?.runId !== this.currentTrace.runId) {
      // if it is the first trace in application, find the previous run
      return this._getLastTraceInPreviousRun(this.currentTrace) || this.currentTrace;
    }
    else return prevTrace || this.currentTrace;
  }

  getNextTrace() {
    const nextTrace = this._getNextTraceInApplication(this.currentTrace);
    if (nextTrace?.runId !== this.currentTrace.runId) {
      // if it is the last trace in application, find the next run
      return this._getFirstTraceInNextRun(this.currentTrace) || this.currentTrace;
    }
    else return nextTrace || this.currentTrace;
  }

  getPreviousInContext(trace = this.currentTrace) {
    const dp = this._getDataProviderOfTrace(trace);
    const traces = dp.indexes.traces.byContext.get(trace.contextId);
    if (!traces?.length) return null;

    const binarySearch = (left, right) => {
      const middle = Math.floor((left + right) / 2);
      if (trace === traces[middle]) return middle;
      if (left + 1 === right) return (traces[left] === trace) ? left : right;
      if (traces[middle].traceId < trace.traceId) return binarySearch(middle, right);
      if (trace.traceId < traces[middle].traceId) return binarySearch(left, middle);
      throw Error('No return value in binarySearch.');
    };

    const indexInTracesInTraces = binarySearch(0, traces.length - 1);
    if (indexInTracesInTraces === 0) return null;
    else return traces[indexInTracesInTraces - 1];
  }

  getNextInContext(trace = this.currentTrace) {
    const dp = this._getDataProviderOfTrace(trace);
    const traces = dp.indexes.traces.byContext.get(trace.contextId);
    if (!traces?.length) return null;

    const binarySearch = (left, right) => {
      const middle = Math.floor((left + right) / 2);
      if (left + 1 === right) return (traces[left] === trace) ? left : right;
      if (traces[middle].traceId === trace.traceId) return middle;
      if (traces[middle].traceId < trace.traceId) return binarySearch(middle, right);
      if (traces[middle].traceId > trace.traceId) return binarySearch(left, middle);
      throw Error('No return value in binarySearch.');
    };

    const indexInTracesInTraces = binarySearch(0, traces.length - 1);
    if (indexInTracesInTraces === traces.length - 1) return null;
    else return traces[indexInTracesInTraces + 1];
  }

  getPreviousParentContext(trace = this.currentTrace) {
    const dp = this._getDataProviderOfTrace(trace);
    const traces = dp.indexes.traces.byContext.get(trace.contextId);
    if (trace !== traces[0]) {
      return traces[0];
    }
    else {
      // already the first trace in context
      const prevTrace = dp.collections.traces.getById(trace.traceId - 1);
      if (!prevTrace) return this._getLastTraceInPreviousRun(trace);
      const context = dp.collections.executionContexts.getById(trace.contextId);
      const prevContext = dp.collections.executionContexts.getById(prevTrace.contextId);
      if (context.parentContextId === prevContext.contextId) {
        // found parent context
        return prevTrace;
      }
      else if (context.parentContextId === prevContext.parentContextId) {
        // no matching parent found (prev trace is sibling, should be different run)
        if (trace.runId !== prevTrace.runId) {
          return this._getLastTraceInPreviousRun(trace);
        }
        else {
          logError('[PrevParent] Neighboring traces with neighboring contexts have same runId.');
          return null;
        }
      }
      else {
        logError('[PrevParent] Neighboring traces having non-neighboring contexts.');
        return null;
      }
    }
  }

  getNextParentContext(trace = this.currentTrace) {
    const dp = this._getDataProviderOfTrace(trace);
    const traces = dp.indexes.traces.byContext.get(trace.contextId);
    if (trace !== traces[traces.length - 1]) {
      return traces[traces.length - 1];
    }
    else {
      // already the last trace in context
      const nextTrace = dp.collections.traces.getById(trace.traceId + 1);
      if (!nextTrace) return this._getFirstTraceInNextRun(trace);
      const context = dp.collections.executionContexts.getById(trace.contextId);
      const nextContext = dp.collections.executionContexts.getById(nextTrace.contextId);
      if (context.parentContextId === nextContext.contextId) {
        // found parent context
        return nextTrace;
      }
      else if (context.parentContextId === nextContext.parentContextId) {
        // no matching parent found (next trace is sibling, should be different run)
        if (trace.runId !== nextTrace.runId) {
          return this._getFirstTraceInNextRun(trace);
        }
        else {
          logError('[NextParent] Neighboring traces with neighboring contexts have same runId.');
          return null;
        }
      }
      else {
        logError('[NextParent] Neighboring traces having non-neighboring contexts.');
        return null;
      }
    }
  }

  getPreviousChildContext(trace = this.currentTrace) {
    const dp = this._getDataProviderOfTrace(trace);
    let { traceId } = trace;
    let prevTrace = trace;
    let currentTrace;
    do {
      currentTrace = prevTrace;
      prevTrace = dp.collections.traces.getById(traceId - 1);
      traceId--;
      if (!prevTrace) return null;
    }
    while (currentTrace.contextId === prevTrace.contextId);   // skip all traces in context

    const currentContext = dp.collections.executionContexts.getById(currentTrace.contextId);
    const prevContext = dp.collections.executionContexts.getById(prevTrace.contextId);

    if (currentContext.contextId === prevContext.parentContextId) {
      // found child context
      return prevTrace;
    }
    else if (currentContext.parentContextId === prevContext.contextId) {
      // no matching child found (prev trace goes up)
      return null;
    }
    else if (currentContext.parentContextId === prevContext.parentContextId) {
      // no matching child found (prev trace is sibling)
      return null;
    }
    else {
      logError('[PrevChild] Neighboring traces having non-neighboring contexts.');
      return null;
    }
  }

  getNextChildContext(trace = this.currentTrace) {
    const dp = this._getDataProviderOfTrace(trace);
    let { traceId } = trace;
    let nextTrace = trace;
    let currentTrace;

    do {
      currentTrace = nextTrace;
      nextTrace = dp.collections.traces.getById(traceId + 1);
      traceId++;
      if (!nextTrace) return null;
    }
    while (currentTrace.contextId === nextTrace.contextId);   // skip all traces in context
    
    const currentContext = dp.collections.executionContexts.getById(currentTrace.contextId);
    const nextContext = dp.collections.executionContexts.getById(nextTrace.contextId);

    if (currentContext.contextId === nextContext.parentContextId) {
      // found child context
      return nextTrace;
    }
    else if (currentContext.parentContextId === nextContext.contextId) {
      // no matching child found (next trace goes up)
      return null;
    }
    else if (currentContext.parentContextId === nextContext.parentContextId) {
      // no matching child found (next trace is sibling)
      return null;
    }
    else {
      logError('[NextChild] Neighboring traces having non-neighboring contexts.');
      return null;
    }
  }

  // ###########################################################################
  // Play helpers
  // ###########################################################################

  _onPlay = () => {
    const { currentTrace } = this;
    this.gotoNextTrace();
    if (currentTrace === this.currentTrace) this.pause();
  }

  _setTrace(trace) {
    if (!trace) return;
    if (this.currentTrace !== trace) {
      traceSelection.selectTrace(trace);
    }
  }

  _setTimerInterval(interval) {
    this.timerInterval = interval;
    if (this._isPlaying) {
      clearInterval(this.timer);
      this.play();
    }
  }

  // ###########################################################################
  // Util
  // ###########################################################################

  // ########################################
  //  Traces (Returning null if not found)
  // ########################################

  _getFirstTraceInOrder() {
    return this.firstTracesInOrder.getFirstTraceInOrder();
  }

  /**
   * @param {Trace} trace 
   */
  _getLastTraceInPreviousRun(trace) {
    const firstTrace = this._getFirstTraceInSameRun(trace);
    const prevFirstTrace = this.firstTracesInOrder.getPreviousFirstTrace(firstTrace);
    if (!prevFirstTrace) return null;
    const prevDataProvider = this._getDataProviderOfTrace(prevFirstTrace);
    return prevDataProvider.util.getLastTraceOfRun(prevFirstTrace.runId);
  }

  /**
   * @param {Trace} trace 
   */
  _getFirstTraceInNextRun(trace) {
    const firstTrace = this._getFirstTraceInSameRun(trace);
    const nextFirstTrace = this.firstTracesInOrder.getNextFirstTrace(firstTrace);
    return nextFirstTrace;
  }

  /**
   * @param {Trace} trace 
   */
  _getPreviousTraceInApplication(trace) {
    const dataProvider = this._getDataProviderOfTrace(trace);
    const nextTrace = dataProvider.collections.traces.getById(trace.traceId - 1);
    return nextTrace;
  }

  /**
   * @param {Trace} trace 
   */
  _getNextTraceInApplication(trace) {
    const dataProvider = this._getDataProviderOfTrace(trace);
    const nextTrace = dataProvider.collections.traces.getById(trace.traceId + 1);
    return nextTrace;
  }

  /**
   * @param {Trace} trace 
   */
  _getFirstTraceInSameRun(trace) {
    const dataProvider = this._getDataProviderOfTrace(trace);
    const firstTrace = dataProvider.util.getFirstTraceOfRun(trace.runId);
    return firstTrace;
  }

  // ########################################
  //  DataProvider
  // ########################################

  /**
   * @param {Trace} trace 
   */
  _getDataProviderOfTrace(trace) {
    const { dataProvider } = allApplications.getApplication(trace.applicationId);
    return dataProvider;
  }

  /**
   * @param {ExecutionContext} rootContext
   */
  _getDataProviderOfRootContext(rootContext) {
    const { dataProvider } = allApplications.getApplication(rootContext.applicationId);
    return dataProvider;
  }

  // ###########################################################################
  // Events
  // ###########################################################################

  onPause(cb) {
    this._emitter.on('pause', cb);
  }

  _emitPause() {
    this._emitter.emit('pause');
  }

  _handleApplicationsChanged = () => {
    if (!this.currentTrace) return;
    if (!this.applicationSet.containsApplication(this.currentTrace.applicationId)) {
      this._setTrace(null);
    }
  }

  _handleTraceSelectionChanged = (trace) => {
    this.currentTrace = trace;
  }

  // ###########################################################################
  // Getter / Setter
  // ###########################################################################

  get trace() {
    return this.currentTrace;
  }

  set trace(trace) {
    this._setTrace(trace);
  }

  /**
   * @param {number} interval
   */
  set interval(interval) {
    this._setTimerInterval(interval);
  }
}

let tracePlayback = new TracePlayback(allApplications.selection.data);

export default tracePlayback;