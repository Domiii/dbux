import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


/**
 *  aka "ContextsByParentIndex"
 */
export default class ContextChildrenIndex extends CollectionIndex<ExecutionContext> {
  constructor() {
    super('executionContexts', 'children');
  }

  makeKey(dp: DataProvider, context: ExecutionContext) {
    return context.parentContextId || 0;
  }
}