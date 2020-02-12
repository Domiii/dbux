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
    this._setTrace(this.getPreviousTrace(this.currentTrace));
  }

  gotoNextTrace() {
    // if (!this.currentTrace) return;
    if (!this.currentTrace) this._setTrace(this.firstTracesInOrder.getFirstTraceInOrder());
    this._setTrace(this.getNextTrace(this.currentTrace));
  }

  gotoPreviousInContext() {
    if (!this.currentTrace) return;
    this._setTrace(this.getPreviousInContext(this.currentTrace));
  }

  gotoNextInContext() {
    if (!this.currentTrace) return;
    this._setTrace(this.getNextInContext(this.currentTrace));
  }

  gotoPreviousParentContext() {
    if (!this.currentTrace) return;
    this._setTrace(this.getPreviousParentContext(this.currentTrace));
  }

  gotoNextParentContext() {
    if (!this.currentTrace) return;
    this._setTrace(this.getNextParentContext(this.currentTrace));
  }

  gotoPreviousChildContext() {

  }

  gotoNextChildContext() {

  }

  // ###########################################################################
  // Main play functions (Getter)
  // ###########################################################################

  /**
   * @param {Trace} trace 
   */
  getPreviousTrace(trace) {
    const prevTrace = this._getPreviousTraceInApplication(trace);
    if (prevTrace?.runId !== trace.runId) {
      // if it is the first trace in application, find the previous run
      return this._getLastTraceInPreviousRun(trace) || trace;
    }
    else return prevTrace || trace;
  }

  /**
   * @param {Trace} trace 
   */
  getNextTrace(trace) {
    const nextTrace = this._getNextTraceInApplication(trace);
    if (nextTrace?.runId !== trace.runId) {
      // if it is the last trace in application, find the next run
      return this._getFirstTraceInNextRun(trace) || trace;
    }
    else return nextTrace || trace;
  }

  /**
   * @param {Trace} trace 
   */
  getPreviousInContext(trace) {
    const dp = this._getDataProviderOfTrace(trace);
    return dp.util.getPreviousTraceInContext(trace);
  }

  /**
   * @param {Trace} trace 
   */
  getNextInContext(trace) {
    const dp = this._getDataProviderOfTrace(trace);
    return dp.util.getNextTraceInContext(trace);
  }

  /**
   * @param {Trace} trace 
   */
  getPreviousParentContext(trace) {
    const dp = this._getDataProviderOfTrace(trace);
    return dp.util.getPreviousTraceInParentContext(trace);
  }

  /**
   * @param {Trace} trace 
   */
  getNextParentContext(trace) {
    const dp = this._getDataProviderOfTrace(trace);
    return dp.util.getNextTraceInParentContext(trace);
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