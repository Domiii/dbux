import ExecutionContext from '@dbux/common/src/core/data/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';

function makeKey(dp: DataProvider, context: ExecutionContext) {
  const lastContextRunId = dp.collections.executionContexts.getById(context.contextId - 1)?.runId;
  if (!lastContextRunId) return 1;
  if (lastContextRunId !== context.runId) return 1;
  return false;
}


export default class FirstContextsInRunsIndex extends CollectionIndex<ExecutionContext> {
  constructor() {
    super('executionContexts', 'firstInRuns');
  }

  makeKey = makeKey
}