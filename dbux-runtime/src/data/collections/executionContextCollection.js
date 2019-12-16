import programStaticContextCollection from './programStaticContextCollection';
// import Enum from '-dbux-common/Enum';
import Enum from 'dbux-common/dist/util/Enum';
import ExecutionContext from './ExecutionContext';

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

  getContext(contextId) {
    return this._contexts[contextId];
  }

  /**
   * @return {ExecutionContext}
   */
  addImmediate(programId, staticContextId, rootContextId) {
    const orderId = programStaticContextCollection.genContextId(programId, staticContextId);
    const contextId = this._contexts.length;
    rootContextId = rootContextId || contextId;
    this._contexts.push(ExecutionContext.allocate(ExecutionContextType.Immediate, contextId, programId, staticContextId, orderId, rootContextId));
  }

  // /**
  //  * @return {ExecutionContext}
  //  */
  // schedule(programId, staticContextId, schedulerId) {
  //   const orderId = programStaticContextCollection.genContextId(programId, staticContextId);
  //   const contextId = this._contexts.length;
  //   this._contexts.push(ExecutionContext.allocate(ExecutionContextType.Schedule, contextId, programId, staticContextId, orderId, schedulerId));
  // }



  // getTextId(contextId) {
  //   const context = this.getContext(contextId);
  //   const { contextType, programId, staticContextId, orderId, schedulerId} = context;
  //   return `${this._staticContextId}${schedulerId ? `_${schedulerId}` : ''}_${orderId}`;
  // }
}

const executionContextCollection = new ExecutionContextCollection();

export default executionContextCollection;