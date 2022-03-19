import ExecutionContext from '@dbux/common/src/types/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';



/** @extends {CollectionIndex<ExecutionContext>} */
export default class ContextsByCallerTraceIndex extends CollectionIndex {
  constructor() {
    super('executionContexts', 'byCallerTrace');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {ExecutionContext} context
   */
  makeKey(dp, context) {
    const callerTrace = dp.util.getCallerTraceOfContext(context.contextId);
    return callerTrace?.traceId || false;
  }

  // /**
  //  * @param {ExecutionContext[]} contexts
  //  */
  // postIndexRaw(contexts) {

  // }
}