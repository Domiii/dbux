
import ExecutionContext from '@dbux/common/src/core/data/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';


/**
 * @extends {CollectionIndex<ExecutionContext>}
 */
export default class ContextsByStaticContextIndex extends CollectionIndex {
  constructor() {
    super('executionContexts', 'byStaticContext');
  }

  /**
   * 
   * @param {RuntimeDataProvider} dp 
   * @param {ExecutionContext} context 
   */
  makeKey(dp, context) {
    return context.staticContextId;
  }
}
