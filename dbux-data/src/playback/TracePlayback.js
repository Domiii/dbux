import Trace from 'dbux-common/src/core/data/Trace';
import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
// ###########################################################################
// TraceOrder
// ###########################################################################

export class TraceStep {
  applicationId;
  traceId;
}

export default class TracePlayback {
  /**
   * @param {ApplicationSelectionData} applicationSelectionData 
   */
  constructor(applicationSelectionData) {
    this.applicationSelectionData = applicationSelectionData;
    this.applicationSelection = this.applicationSelectionData.selection;
    this.applicationCollection = this.applicationSelection.collection;
  }

  // ###########################################################################
  // Play functions
  // ###########################################################################

  /**
   * @param {Trace} trace 
   */
  getPreviousTraceInOrder(trace) {
    const prevTrace = this.getPreviousTraceInApplication(trace);
    if (!prevTrace) {
      // if it is the last trace in application, find next rootContext
      const newTrace = this.getLastTraceInPreviousRootContext(trace);
      return newTrace;
    }
    else if (prevTrace.contextId !== trace.contextId) {
      // check if root context changed, and if so, find the correct next rootContext
      const dataProvider = this.getDataProviderOfTrace(trace);
      const rootContextId = dataProvider.util.getRootContextIdByContextId(trace.contextId);
      const prevRootContextId = dataProvider.util.getRootContextIdByContextId(prevTrace.contextId);
      if (prevRootContextId !== rootContextId) {
        const newTrace = this.getLastTraceInPreviousRootContext(trace);
        return newTrace;
      }
    }
    return prevTrace;
  }

  /**
   * @param {Trace} trace 
   */
  getNextTraceInOrder(trace) {
    const nextTrace = this.getNextTraceInApplication(trace);
    if (!nextTrace) {
      // if it is the last trace in application, find next rootContext
      const newTrace = this.getFirstTraceInNextRootContext(trace);
      return newTrace;
    }
    else if (nextTrace.contextId !== trace.contextId) {
      // check if root context changed, and if so, find the correct next rootContext
      const dataProvider = this.getDataProviderOfTrace(trace);
      const rootContextId = dataProvider.util.getRootContextIdByContextId(trace.contextId);
      const nextRootContextId = dataProvider.util.getRootContextIdByContextId(nextTrace.contextId);
      if (rootContextId !== nextRootContextId) {
        const newTrace = this.getFirstTraceInNextRootContext(trace);
        return newTrace;
      }
    }
    return nextTrace;
  }

  // ###########################################################################
  // Util
  // ###########################################################################

  getFirstTraceInOrder() {
    const { rootContextsInOrder } = this.applicationCollection.selection.data;
    const firstRootContext = rootContextsInOrder.getFirstRootContext();
    if (!firstRootContext) return null;
    const dataProvider = this.getDataProviderOfRootContext(firstRootContext);
    return dataProvider.util.getFirstTraceOfContext(firstRootContext.contextId);
  }

  /**
   * @param {Trace} trace 
   */
  getNextTraceInApplication(trace) {
    const { applicationId, traceId } = trace;
    const application = this.applicationCollection.getApplication(applicationId);
    const nextTrace = application.dataProvider.collections.traces.getById(traceId + 1);
    return nextTrace;
  }

  /**
   * @param {Trace} trace 
   */
  getPreviousTraceInApplication(trace) {
    const { applicationId, traceId } = trace;
    const application = this.applicationCollection.getApplication(applicationId);
    const nextTrace = application.dataProvider.collections.traces.getById(traceId - 1);
    return nextTrace;
  }

  /**
   * @param {Trace} trace 
   */
  getDataProviderOfTrace(trace) {
    const application = this.applicationCollection.getApplication(trace.applicationId);
    return application.dataProvider;
  }

  /**
   * @param {ExecutionContext} rootContext
   */
  getDataProviderOfRootContext(rootContext) {
    const application = this.applicationCollection.getApplication(rootContext.applicationId);
    return application.dataProvider;
  }

  /**
   * @param {Trace} trace 
   */
  getFirstTraceInNextRootContext(trace) {
    const rootContext = this.getRootContextOfTrace(trace);
    const { rootContextsInOrder } = this.applicationSelectionData;
    const nextRootContext = rootContextsInOrder.getNextRootContext(rootContext);
    if (!nextRootContext) return null;
    const nextDataProvider = this.getDataProviderOfRootContext(nextRootContext);
    const newTrace = nextDataProvider.util.getFirstTraceOfContext(nextRootContext.contextId);
    return newTrace;
  }

  /**
   * @param {Trace} trace 
   */
  getLastTraceInPreviousRootContext(trace) {
    const rootContext = this.getRootContextOfTrace(trace);
    const { rootContextsInOrder } = this.applicationSelectionData;
    const prevRootContext = rootContextsInOrder.getPreviousRootContext(rootContext);
    if (!prevRootContext) return null;
    const prevDataProvider = this.getDataProviderOfRootContext(prevRootContext);
    const newTrace = prevDataProvider.util.getLastTraceOfContext(prevRootContext.contextId);
    return newTrace;
  }

  /**
   * @param {Trace} trace 
   */
  getRootContextOfTrace(trace) {
    const dataProvider = this.getDataProviderOfTrace(trace);
    const rootContextId = dataProvider.util.getRootContextIdByContextId(trace.contextId);
    return dataProvider.collections.executionContexts.getById(rootContextId);
  }
}