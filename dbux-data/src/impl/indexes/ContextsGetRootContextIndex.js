import StaticTrace from '@dbux/common/src/types/StaticTrace';
import ExecutionContext from '@dbux/common/src/types/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';


/** @extends {CollectionIndex<ExecutionContext>} */
export default class ContextsGetRootContextIndex extends CollectionIndex {
  constructor() {
    super('executionContexts', 'getRootContext');
  }
  
  /** 
   * @param {RuntimeDataProvider} dp
   * @param {executionContext} context
   */
  makeKey(/* dp, context */) {
    // TODO
    //context.parentContextId
  }
}