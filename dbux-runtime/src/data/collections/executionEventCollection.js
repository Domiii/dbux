import ExecutionEventType, { isPushEvent, isPopEvent } from '../ExecutionEventType';
import ExecutionEvent from './ExecutionEvent';
import executionContextCollection from './executionContextCollection';
import staticContextCollection from './staticContextCollection';
import staticProgramContextCollection from './staticProgramContextCollection';


let timer = null;

export class ExecutionEventCollection {

  /**
   * @private
   * @type {ExecutionEvent[]}
   */
  _events = [];

  logPushImmediate(contextId) {
    const event = ExecutionEvent.allocate();
    event.eventType = ExecutionEventType.PushImmediate;
    event.contextId = contextId;

    const staticContext = executionContextCollection.getStaticContext(contextId);
    event.where = staticContext.loc?.start;

    this._log(event);
  }

  logPopImmediate(contextId) {
    const event = ExecutionEvent.allocate();
    event.eventType = ExecutionEventType.PopImmediate;
    event.contextId = contextId;

    const staticContext = executionContextCollection.getStaticContext(contextId);
    event.where = staticContext.loc?.end;

    this._log(event);
  }

  logScheduleCallback(scheduledContextId) {
    const event = ExecutionEvent.allocate();
    event.eventType = ExecutionEventType.ScheduleCallback;
    event.contextId = scheduledContextId;

    const staticContext = executionContextCollection.getStaticContext(scheduledContextId);
    event.where = staticContext.loc?.start;

    this._log(event);
  }

  logPushCallback(callbackContextId) {
    const event = ExecutionEvent.allocate();
    event.eventType = ExecutionEventType.PushCallback;
    event.contextId = callbackContextId;

    const staticContext = executionContextCollection.getStaticContext(callbackContextId);
    event.where = staticContext.loc?.start;

    this._log(event);
  }

  logPopCallback(callbackContextId) {
    const event = ExecutionEvent.allocate();
    event.eventType = ExecutionEventType.PopCallback;
    event.contextId = callbackContextId;

    const staticContext = executionContextCollection.getStaticContext(callbackContextId);
    event.where = staticContext.loc?.end;

    this._log(event);
  }

  logAwait(contextId) {
    const event = ExecutionEvent.allocate();
    event.eventType = ExecutionEventType.Await;
    event.contextId = contextId;

    const staticContext = executionContextCollection.getStaticContext(
      contextId);
    event.where = staticContext.loc?.start;

    this._log(event);
  }

  logResume(contextId) {
    const event = ExecutionEvent.allocate();
    event.eventType = ExecutionEventType.Resume;
    event.contextId = contextId;

    const staticContext = executionContextCollection.getStaticContext(
      contextId);
    event.where = staticContext.loc?.start;

    this._log(event);
  }

  _log(event) {
    this._events.push(event);
    // TODO: send event to server
    ExecutionEventCollection.prettyPrint(event);
  }


  static prettyPrint(event) {
    const {
      eventType,
      contextId,
      where
    } = event;

    const typeName = ExecutionEventType.nameFrom(eventType);
    const context = executionContextCollection.getContext(contextId);
    
    const {
      programId,
      staticContextId,
      parentContextId,
      stackDepth,
      other
    } = context;
    const staticProgramContext = staticProgramContextCollection.getProgramContext(programId);
    const staticContext = staticContextCollection.getContext(programId, staticContextId);

    const {
      displayName
    } = staticContext;
    const {
      fileName
    } = staticProgramContext;
    const line = where?.line;
    const lineSuffix = line ? `:${line}` : '';
    const codeLocation = `@${fileName}${lineSuffix}`;
    // const depthIndicator = `(${parentContextId})`;
    const depthIndicator = ` `.repeat(stackDepth);
    // const depthIndicator = ''; // we are using `console.group` for this for now
    let message = `${contextId} ${depthIndicator}${displayName} [${typeName}] ${codeLocation} (${parentContextId}) [DBUX]`;


    if (!timer) {
      message = '       ---------------\n' + message;
      // else if (isPopEvent(eventType)) {
      //   message = message + '\n       ---------------';
      // }
    }

    if (isPushEvent(eventType)) {
      // console.group(contextId);
    }
    console.debug('%c' + message, 'color: lightgray');
    // console.debug(message);
    if (isPopEvent(eventType)){
      // console.groupEnd();
    }

    // (pretty accurate) hackfix: simulate end of (partial) stack
    if (!timer) {
      timer = setImmediate(() => {
        console.log('       ---------------\n');
        timer = null;
      });
    }
  }

}

const executionEventCollection = new ExecutionEventCollection();

export default executionEventCollection;