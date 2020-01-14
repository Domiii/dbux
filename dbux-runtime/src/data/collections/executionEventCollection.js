// import ExecutionEventType, { isPushEvent, isPopEvent } from 'dbux-common/src/core/constants/ExecutionEventType';
// import ExecutionEvent from './ExecutionEvent';
// import executionContextCollection from './executionContextCollection';
// import staticContextCollection from './staticContextCollection';
// import staticProgramContextCollection from './staticProgramContextCollection';


// let timer = null;

// export class ExecutionEventCollection {

//   /**
//    * @private
//    * @type {ExecutionEvent[]}
//    */
//   _events = [];

//   tracePushImmediate(contextId, traceId) {
//     const event = ExecutionEvent.allocate();
//     event.eventType = ExecutionEventType.PushImmediate;
//     event.contextId = contextId;

//     this._trace(event);
//   }

//   tracePopImmediate(contextId) {
//     const event = ExecutionEvent.allocate();
//     event.eventType = ExecutionEventType.PopImmediate;
//     event.contextId = contextId;

//     const staticContext = executionContextCollection.getStaticContext(contextId);
//     event.where = staticContext.loc?.end;

//     this._trace(event);
//   }

//   traceScheduleCallback(scheduledContextId) {
//     const event = ExecutionEvent.allocate();
//     event.eventType = ExecutionEventType.ScheduleCallback;
//     event.contextId = scheduledContextId;

//     const staticContext = executionContextCollection.getStaticContext(scheduledContextId);
//     event.where = staticContext.loc?.start;

//     this._trace(event);
//   }

//   tracePushCallback(callbackContextId) {
//     const event = ExecutionEvent.allocate();
//     event.eventType = ExecutionEventType.PushCallback;
//     event.contextId = callbackContextId;

//     const staticContext = executionContextCollection.getStaticContext(callbackContextId);
//     event.where = staticContext.loc?.start;

//     this._trace(event);
//   }

//   tracePopCallback(callbackContextId) {
//     const event = ExecutionEvent.allocate();
//     event.eventType = ExecutionEventType.PopCallback;
//     event.contextId = callbackContextId;

//     const staticContext = executionContextCollection.getStaticContext(callbackContextId);
//     event.where = staticContext.loc?.end;

//     this._trace(event);
//   }

//   traceAwait(contextId) {
//     const event = ExecutionEvent.allocate();
//     event.eventType = ExecutionEventType.Await;
//     event.contextId = contextId;

//     const staticContext = executionContextCollection.getStaticContext(
//       contextId);
//     event.where = staticContext.loc?.start;

//     this._trace(event);
//   }

//   traceResume(contextId) {
//     const event = ExecutionEvent.allocate();
//     event.eventType = ExecutionEventType.Resume;
//     event.contextId = contextId;

//     const staticContext = executionContextCollection.getStaticContext(
//       contextId);
//     event.where = staticContext.loc?.start;

//     this._trace(event);
//   }

//   _trace(event) {
//     this._events.push(event);
//     // TODO: send event to server
//     ExecutionEventCollection.prettyPrint(event);
//   }



// }

// const executionEventCollection = new ExecutionEventCollection();

// export default executionEventCollection;