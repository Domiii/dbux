import Trace from 'dbux-common/src/core/data/Trace';
import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import allApplications from '../applications/allApplications';

// ###########################################################################
// TraceOrder
// ###########################################################################

export default class TracePlayback {
  /**
   * @param {ApplicationSelectionData} applicationSelectionData 
   */
  constructor(applicationSelectionData) {
    this.applicationSelectionData = applicationSelectionData;
    this.applicationSelection = this.applicationSelectionData.selection;
  }

  // ###########################################################################
  // Play functions
  // ###########################################################################

  /**
   * @param {Trace} trace 
   */
  getPreviousTraceInOrder(trace) {
    const prevTrace = this.getPreviousTraceInApplication(trace);
    if (prevTrace?.runId !== trace.runId) {
      const newTrace = this.getLastTraceInPreviousRun(trace);
      return newTrace;
    }
    else return prevTrace;
  }

  /**
   * @param {Trace} trace 
   */
  getNextTraceInOrder(trace) {
    const nextTrace = this.getNextTraceInApplication(trace);
    if (nextTrace?.runId !== trace.runId) {
      // if it is the last trace in application, find next run
      const newTrace = this.getFirstTraceInNextRun(trace);
      return newTrace;
    }
    else return nextTrace;
  }

  // ###########################################################################
  // Util
  // ###########################################################################

  getFirstTraceInOrder() {
    const { rootTracesInOrder } = allApplications.selection.data;
    return rootTracesInOrder.getFirstRootTrace();
  }

  /**
   * @param {Trace} trace 
   */
  getNextTraceInApplication(trace) {
    const { applicationId, traceId } = trace;
    const application = allApplications.getApplication(applicationId);
    const nextTrace = application.dataProvider.collections.traces.getById(traceId + 1);
    return nextTrace;
  }

  /**
   * @param {Trace} trace 
   */
  getPreviousTraceInApplication(trace) {
    const { applicationId, traceId } = trace;
    const application = allApplications.getApplication(applicationId);
    const nextTrace = application.dataProvider.collections.traces.getById(traceId - 1);
    return nextTrace;
  }

  /**
   * @param {Trace} trace 
   */
  getDataProviderOfTrace(trace) {
    const application = allApplications.getApplication(trace.applicationId);
    return application.dataProvider;
  }

  /**
   * @param {ExecutionContext} rootContext
   */
  getDataProviderOfRootContext(rootContext) {
    const application = allApplications.getApplication(rootContext.applicationId);
    return application.dataProvider;
  }

  /**
   * @param {Trace} trace 
   */
  getFirstTraceInNextRun(trace) {
    const rootTrace = this.getRootTraceOfTrace(trace);
    const { rootTracesInOrder } = this.applicationSelectionData;
    const nextRootTrace = rootTracesInOrder.getNextRootTrace(rootTrace);
    return nextRootTrace;
  }

  /**
   * @param {Trace} trace 
   */
  getLastTraceInPreviousRun(trace) {
    const rootTrace = this.getRootTraceOfTrace(trace);
    const { rootTracesInOrder } = this.applicationSelectionData;
    const prevRootTrace = rootTracesInOrder.getPreviousRootTrace(rootTrace);
    if (!prevRootTrace) return null;
    const prevDataProvider = this.getDataProviderOfTrace(prevRootTrace);
    const newTrace = prevDataProvider.util.getLastTraceOfRun(prevRootTrace.runId);
    return newTrace;
  }

  /**
   * @param {Trace} trace 
   */
  getRootTraceOfTrace(trace) {
    const dataProvider = this.getDataProviderOfTrace(trace);
    const rootTrace = dataProvider.indexes.traces.byRunId.get(trace.runId)[0] || null;
    return rootTrace;
  }
}