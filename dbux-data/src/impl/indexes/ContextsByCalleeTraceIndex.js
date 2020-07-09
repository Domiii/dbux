import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';

function makeKey(dp: DataProvider, context: ExecutionContext) {
  const callerTrace = dp.util.getCallerTraceOfContext(context.contextId);
  return callerTrace?.traceId || false;
}


export default class ContextsByCalleeTraceIndex extends CollectionIndex<ExecutionContext> {
  constructor() {
    super('executionContexts', 'byCalleeTrace');
  }

  makeKey = makeKey
}