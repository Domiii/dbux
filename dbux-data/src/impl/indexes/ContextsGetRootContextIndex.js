import StaticTrace from '@dbux/common/src/core/data/StaticTrace';
import ExecutionContext from '@dbux/common/src/core/data/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


/** @extends {CollectionIndex<ExecutionContext>} */
export default class ContextsGetRootContextIndex extends CollectionIndex {
  constructor() {
    super('executionContexts', 'getRootContext');
  }
  
  /** 
   * @param {DataProvider} dp
   * @param {executionContext} context
   */
  makeKey(/* dp, context */) {
    // TODO
    //context.parentContextId
  }
}