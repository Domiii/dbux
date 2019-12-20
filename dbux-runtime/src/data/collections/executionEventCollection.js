import ExecutionEventType from '../ExecutionEventType';
import ExecutionEvent from './ExecutionEvent';
import executionContextCollection from './executionContextCollection';

export class ExecutionEventCollection {

  /**
   * @private
   * @type {ExecutionEvent[]}
   */
  _events = [];

  logPushImmediate(contextId, stackDepth) {
    const event = ExecutionEvent.allocate();
    event.eventType = ExecutionEventType.PushImmediate;
    event.contextId = contextId;
    event.stackDepth = stackDepth;

    this._log(event);
  }

  logPopImmediate(contextId, stackDepth) {
    const event = ExecutionEvent.allocate();
    event.eventType = ExecutionEventType.PopImmediate;
    event.contextId = contextId;
    event.stackDepth = stackDepth;

    this._log(event);
  }

  _log(event) {
    this._events.push(event);
    ExecutionEventCollection.prettyPrint(event);
  }


  static prettyPrint(state) {
    const {
      eventType,
      contextId
    } = state;

    const typeName = ExecutionEventType.nameFrom(eventType);
    const context = executionContextCollection.getContext(contextId);

    const {
      staticContextId,
      rootContextId
    } = context;

    const staticContext = static

    const message = `(${rootContextId}) [${typeName}] ${staticContextId}`;
    console.log(`[DBUX]`, message);
  }

}

const executionEventCollection = new ExecutionEventCollection();

export default executionEventCollection;