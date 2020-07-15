
import ExecutionContext from '@dbux/common/src/core/data/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


/**
 * @extends {CollectionIndex<ExecutionContext>}
 */
export default class ContextsByStaticContextIndex extends CollectionIndex {
  constructor() {
    super('executionContexts', 'byStaticContext');
  }

  /**
   * 
   * @param {DataProvider} dp 
   * @param {ExecutionContext} context 
   */
  makeKey(dp, context) {
    return context.staticContextId;
  }
}
