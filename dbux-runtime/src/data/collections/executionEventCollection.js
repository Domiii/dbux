import ExecutionEventType, { isPushEvent, isPopEvent } from '../ExecutionEventType';
import ExecutionEvent from './ExecutionEvent';
import executionContextCollection from './executionContextCollection';
import staticContextCollection from './staticContextCollection';
import programStaticContextCollection from './programStaticContextCollection';


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

  _log(event) {
    this._events.push(event);
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
      parentScopeContextId,
      stackDepth
    } = context;
    const programStaticContext = programStaticContextCollection.getProgramContext(programId);
    const staticContext = staticContextCollection.getContext(programId, staticContextId);

    const {
      displayName
    } = staticContext;
    const {
      fileName
    } = programStaticContext;
    const line = where?.line;
    const lineSuffix = line ? `:${line}` : '';
    // const depthIndicator = `(${parentScopeContextId})`;
    const depthIndicator = `  `.repeat(stackDepth);
    let message = `[DBUX] ${depthIndicator} ${displayName} [${typeName}] @${fileName}${lineSuffix}`;

    if (!parentScopeContextId) {
      if (isPushEvent(eventType)) {
        message = '       ---------------\n' + message;
      }
      else if (isPopEvent(eventType)) {
        message = message + '\n       ---------------';
      }
    }
    console.log(message);

    // hackfix: simulate end of (partial) stack
    // if (!timer) {
    //   timer = setImmediate(() => {
    //     console.log(`[DBUX]\n[DBUX] ---------\n[DBUX]`);
    //     timer = null;
    //   });
    // }
  }

}

const executionEventCollection = new ExecutionEventCollection();

export default executionEventCollection;