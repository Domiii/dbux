import ExecutionContext from '@dbux/common/src/types/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** 
 * @param {RuntimeDataProvider} dp
 * @param {ExecutionContext} context
 */
function makeKey(dp, context) {
  const callerTrace = dp.util.getCallerTraceOfContext(context.contextId);
  return callerTrace?.traceId || false;
}


/** @extends {CollectionIndex<ExecutionContext>} */
export default class ContextsByCalleeTraceIndex extends CollectionIndex {
  constructor() {
    super('executionContexts', 'byCalleeTrace');
  }

  makeKey = makeKey
}