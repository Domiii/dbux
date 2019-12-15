import ExecutionEventType from './ExecutionEventType';

export class ExecutionEventCollection {

  /**
   * @private
   * @type {ExecutionEvent[]}
   */
  _events;

  logEvent(event) {
    this._events.push(event);
    ExecutionEventCollection.prettyPrint(event);
  }


  static prettyPrint(state) {
    const {
      type,
      contextId
    } = state;

    const typeName = ExecutionEventType.nameFrom(type);

    const message = `[${typeName}] `;
    console.log(`[DBUX]`, message);
  }

}

const executionEventCollection = new ExecutionEventCollection();

export default executionEventCollection;