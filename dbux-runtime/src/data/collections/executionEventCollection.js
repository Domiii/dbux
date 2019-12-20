import ExecutionEventType from '../ExecutionEventType';
import ExecutionEvent from './ExecutionEvent';
import executionContextCollection from './executionContextCollection';
import staticContextCollection from './staticContextCollection';
import programStaticContextCollection from './programStaticContextCollection';

export class ExecutionEventCollection {

  /**
   * @private
   * @type {ExecutionEvent[]}
   */
  _events = [];

  logPushImmediate(contextId, stackDepth) {
    const event = ExecutionEvent.allocate();
    event.eventType = ExecutionEventType.Enter;
    event.contextId = contextId;
    event.stackDepth = stackDepth;

    this._log(event);
  }

  logPopImmediate(contextId, stackDepth) {
    const event = ExecutionEvent.allocate();
    event.eventType = ExecutionEventType.Leave;
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
      programId,
      staticContextId,
      rootContextId
    } = context;
    const programStaticContext = programStaticContextCollection.getProgramContext(programId);
    const staticContext = staticContextCollection.getContext(programId, staticContextId);

    const {
      name,
      line
    } = staticContext;

    const {
      fileName
    } = programStaticContext;

    
    const lineSuffix = line ? `:${line}` : '';
    const message = `(${rootContextId}) [${typeName}] ${name} @${fileName}${lineSuffix}`;
    console.log(`[DBUX]`, message);
  }

}

const executionEventCollection = new ExecutionEventCollection();

export default executionEventCollection;