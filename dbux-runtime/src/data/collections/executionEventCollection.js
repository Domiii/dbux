import ExecutionEventType from '../ExecutionEventType';
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

  logPushImmediate(contextId, stackDepth) {
    const event = ExecutionEvent.allocate();
    event.eventType = ExecutionEventType.Enter;
    event.contextId = contextId;
    event.stackDepth = stackDepth;

    const staticContext = executionContextCollection.getStaticContext(contextId);
    event.where = staticContext.start;

    this._log(event);
  }

  logPopImmediate(contextId, stackDepth) {
    const event = ExecutionEvent.allocate();
    event.eventType = ExecutionEventType.Leave;
    event.contextId = contextId;
    event.stackDepth = stackDepth;

    const staticContext = executionContextCollection.getStaticContext(contextId);
    event.where = staticContext.end;

    this._log(event);
  }

  _log(event) {
    this._events.push(event);
    ExecutionEventCollection.prettyPrint(event);
  }


  static prettyPrint(state) {
    const {
      eventType,
      contextId,
      where
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
      displayName
    } = staticContext;

    const {
      fileName
    } = programStaticContext;

    const line = where?.line;
    
    const lineSuffix = line ? `:${line}` : '';
    const message = `(${rootContextId}) [${typeName}] ${displayName} @${fileName}${lineSuffix}`;
    console.log(`[DBUX]`, message);

    // hackfix: simulate end of (partial) stack
    if (!timer) {
      timer = setImmediate(() => {
        console.log(`[DBUX]\n[DBUX] ---------\n[DBUX]`);
        timer = null;
      });
    }
  }

}

const executionEventCollection = new ExecutionEventCollection();

export default executionEventCollection;