import StaticTrace from '@dbux/common/src/core/data/StaticTrace';
import ExecutionContext from '@dbux/common/src/core/data/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


export default class ContextsGetRootContextIndex extends CollectionIndex<ExecutionContext> {
  constructor() {
    super('executionContexts', 'getRootContext');
  }
  
  makeKey(dp: DataProvider, context: executionContext) {
    // TODO
    //context.parentContextId
  }
}