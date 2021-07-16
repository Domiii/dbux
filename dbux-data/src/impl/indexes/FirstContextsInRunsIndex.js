import ExecutionContext from '@dbux/common/src/types/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** 
 * @param {RuntimeDataProvider} dp
 * @param {ExecutionContext} context
 */
function makeKey(dp, context) {
  const lastContextRunId = dp.collections.executionContexts.getById(context.contextId - 1)?.runId;
  if (!lastContextRunId) return 1;
  if (lastContextRunId !== context.runId) return 1;
  return false;
}


/** @extends {CollectionIndex<ExecutionContext>} */
export default class FirstContextsInRunsIndex extends CollectionIndex {
  constructor() {
    super('executionContexts', 'firstInRuns');
  }

  makeKey = makeKey
}