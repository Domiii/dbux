import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';

function makeKey(dp: DataProvider, context: ExecutionContext) {
  return context.runId;
}


export default class ContextsByRunIndex extends CollectionIndex<ExecutionContext> {
  constructor() {
    super('executionContexts', 'byRun');
  }

  makeKey = makeKey
}