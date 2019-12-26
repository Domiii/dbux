import programStaticContextCollection from './programStaticContextCollection';
// import Enum from '-dbux-common/Enum';
import Enum from 'dbux-common/src/util/Enum';
import ExecutionContext from './ExecutionContext';
import staticContextCollection from './staticContextCollection';

let _instance;

export const ExecutionContextType = new Enum({
  Immediate: 1,
  Schedule: 2,
  Pause: 3,
  Continue: 4
});

export class ExecutionContextCollection {
  /**
   * @return {ExecutionContextCollection}
   */
  static get instance() {
    return _instance || (_instance = new ExecutionContextCollection());
  }

  _lastContextId = -1;
  _contexts = [null];
  _lastOrderIds = [];

  getContext(contextId) {
    return this._contexts[contextId];
  }


  getStaticContext(contextId) {
    const context = this.getContext(contextId);
    const {
      programId,
      staticContextId
    } = context;
    return staticContextCollection.getContext(programId, staticContextId);
  }
  
  _genOrderId(programId, staticContextId) {
    const programOrderIds = this._lastOrderIds[programId] || (this._lastOrderIds[programId] = []);
    const orderId = programOrderIds[staticContextId] || (programOrderIds[staticContextId] = 1);
    ++programOrderIds[staticContextId];
    return orderId;
  }

  /**
   * @return {ExecutionContext}
   */
  addImmediate(programId, staticContextId, rootContextId) {
    const orderId = this._genOrderId(programId, staticContextId);
    const contextId = this._contexts.length;
    rootContextId = rootContextId || contextId;

    const context = ExecutionContext.allocate(ExecutionContextType.Immediate, contextId, programId, staticContextId, orderId, rootContextId);
    this._contexts.push(context);
    return context;
  }

  /**
   * @return {ExecutionContext}
   */
  schedule(programId, staticContextId, rootContextId, schedulerId) {
    const orderId = this._genOrderId(programId, staticContextId);
    const contextId = this._contexts.length;
    rootContextId = rootContextId || contextId;

    const context = ExecutionContext.allocate(ExecutionContextType.Schedule, contextId, programId, staticContextId, orderId, rootContextId, schedulerId);
    this._contexts.push(context);
    return context;
  }



  // getTextId(contextId) {
  //   const context = this.getContext(contextId);
  //   const { contextType, programId, staticContextId, orderId, schedulerId} = context;
  //   return `${this._staticContextId}${schedulerId ? `_${schedulerId}` : ''}_${orderId}`;
  // }
}

const executionContextCollection = new ExecutionContextCollection();

export default executionContextCollection;