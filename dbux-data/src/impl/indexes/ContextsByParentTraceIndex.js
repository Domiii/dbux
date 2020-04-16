import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';

function makeKey(dp: DataProvider, context: ExecutionContext) {
  return context.parentTraceId || false;
}


export default class ContextsByParentTraceIndex extends CollectionIndex<ExecutionContext> {
  constructor() {
    super('executionContexts', 'byParentTrace');
  }

  makeKey = makeKey
}