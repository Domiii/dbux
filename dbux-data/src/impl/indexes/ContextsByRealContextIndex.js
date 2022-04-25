import ExecutionContext from '@dbux/common/src/types/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';


/**
 *  aka "ContextsByParentIndex"
 */
/** @extends {CollectionIndex<ExecutionContext>} */
export default class ContextsByRealContextIndex extends CollectionIndex {
  constructor() {
    super('executionContexts', 'byRealContext');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {ExecutionContext} context
   */
  makeKey(dp, context) {
    return context.realContextId || 0;
  }
}