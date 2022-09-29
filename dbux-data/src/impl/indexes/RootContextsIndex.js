import ExecutionContextType from '@dbux/common/src/types/constants/ExecutionContextType';
import ExecutionContext from '@dbux/common/src/types/ExecutionContext';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';



/** @extends {CollectionIndex<ExecutionContext>} */
export default class RootContextsIndex extends CollectionIndex {
  constructor() {
    super('executionContexts', 'roots');
  }

  getAllRoots() {
    return this.get(1) || EmptyArray;
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {ExecutionContext} context
   */
  makeKey(dp, context) {
    // hackfix: ignore Await context
    if (!dp.util.isRootContext(context.contextId) || ExecutionContextType.is.Await(context.contextType)) {
      return false;
    }
    return 1;
  }
}