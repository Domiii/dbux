import ExecutionContext from '@dbux/common/src/core/data/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


/**
 *  aka "ContextsByParentIndex"
 */
/** @extends {CollectionIndex<ExecutionContext>} */
export default class ContextChildrenIndex extends CollectionIndex {
  constructor() {
    super('executionContexts', 'children');
  }

  /** 
   * @param {DataProvider} dp
   * @param {ExecutionContext} context
   */
  makeKey(dp, context) {
    return context.parentContextId || 0;
  }
}