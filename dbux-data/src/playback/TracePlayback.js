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
  }

  getPreviousTraceInOrder(applicationId, traceId) {
    // TODO
  }

  stepNextTraceInOrder(traceStep) {
    const { applicationId, traceId } = traceStep;
    const application = this.applicationSelectionData._applicationSelection._applicationCollection.getApplication(applicationId);
    const nextId = traceId + 1;
    const trace = application.dataProvider.traces.getById(traceId);
    const next = application.dataProvider.traces.getById(nextId);
    if (!next) {
      const context = this.applicationSelectionData.rootContexts.getNextContext(trace.contextId);
      // TODO
    }
    else if (next.contextId !== trace.contextId) {
      // TODO: check if root context changed, and if so, find correct next rootContext
    }
  }
}