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

  getPreviousTraceInOrder(traceStep) {

  }

  stepNextTraceInOrder(traceStep) {
    const { applicationId, traceId } = traceStep;
    const application = this.applicationCollection.getApplication(applicationId);
    const { dataProvider } = application;
    const lastTraceId = traceId;
    const nextTraceId = lastTraceId + 1;
    const lastTrace = dataProvider.collections.traces.getById(lastTraceId);
    const nextTrace = dataProvider.collections.traces.getById(nextTraceId);
    if (!nextTrace) {
      // if it is the last trace in application, find next rootContext
      // here we assume lastTrace belongs to a rootContext
      const { rootContextsInOrder } = this.applicationSelectionData;
      const newContext = rootContextsInOrder.getNextRootContext(lastTrace.contextId);
      const newApplicationId = newContext.applicationId;
      const newApplication = this.applicationCollection.getApplication(newApplicationId);
      const newDataProvider = newApplication.dataProvider;
      const newTraceId = newDataProvider.util.getFirstTraceOfContext(newContext.contextId).traceId;

      traceStep.applicationId = newApplicationId;
      traceStep.traceId = newTraceId;

      return;
    }
    else if (nextTrace.contextId !== lastTrace.contextId) {
      // check if root context changed, and if so, find the correct next rootContext
      const lastRootContextId = dataProvider.util.getRootContextIdByContextId(lastTrace.contextId);
      const nextRootContextId = dataProvider.util.getRootContextIdByContextId(nextTrace.contextId);
      if (lastRootContextId !== nextRootContextId) {
        const lastContext = dataProvider.collections.executionContexts.getById(lastRootContextId);
        const { rootContextsInOrder } = this.applicationSelectionData;
        const newContext = rootContextsInOrder.getNextRootContext(lastContext);
        if (!newContext) return;
        const newApplicationId = newContext.applicationId;
        const newApplication = this.applicationCollection.getApplication(newApplicationId);
        const newDataProvider = newApplication.dataProvider;
        const newTrace = newDataProvider.util.getFirstTraceOfContext(newContext.contextId)
        const newTraceId = newTrace.traceId;

        traceStep.applicationId = newApplicationId;
        traceStep.traceId = newTraceId;

        return;
      }
    }
    traceStep.traceId = nextTraceId;
  }
}