import ApplicationSelectionData from '../ApplicationSelectionData';

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
    const applicationCollection = this.applicationSelectionData._applicationSelection._applicationCollection;
    const application = applicationCollection.getApplication(applicationId);
    const nextId = traceId + 1;
    const trace = application.dataProvider.traces.getById(traceId);
    const next = application.dataProvider.traces.getById(nextId);
    if (!next) {
      const context = this.applicationSelectionData.rootContextsInOrder.getNextContext(trace.contextId);
      const newApplicationId = context.applicationId;
      // TODO: needs TraceByContextIndex here
      const newTraceId = applicationCollection.getApplication(newApplicationId);
      
      traceStep.applicationId = newApplicationId;
      traceStep.traceId = newTraceId;
    }
    else if (next.contextId !== trace.contextId) {
      // TODO: check if root context changed, and if so, find correct next rootContext
    }
  }
}