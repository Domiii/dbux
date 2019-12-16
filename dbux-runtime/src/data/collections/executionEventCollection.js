import ExecutionEventType from '../ExecutionEventType';
import ExecutionEvent from './ExecutionEvent';

export class ExecutionEventCollection {

  /**
   * @private
   * @type {ExecutionEvent[]}
   */
  _events;

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
      type,
      contextId
    } = state;

    const typeName = ExecutionEventType.nameFrom(type);

    const message = `[${typeName}] ${contextId}`;
    console.log(`[DBUX]`, message);
  }

}

const executionEventCollection = new ExecutionEventCollection();

export default executionEventCollection;