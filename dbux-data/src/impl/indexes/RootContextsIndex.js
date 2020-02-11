import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';

function makeKey(dp: DataProvider, context: ExecutionContext) {
  if (context.parentContextId) return false;
  return 1;
}


export default class RootContextsIndex extends CollectionIndex<ExecutionContext> {
  constructor() {
    super('executionContexts', 'roots');
  }

  makeKey = makeKey
}