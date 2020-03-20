
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';
import ExecutionContext from '../../../../dbux-common/src/core/data/ExecutionContext';


export default class ContextsByStaticContextIndex extends CollectionIndex<ExecutionContext> {
  constructor() {
    super('executionContexts', 'byStaticContext');
  }

  makeKey(dp: DataProvider, context: ExecutionContext) {
    return context.staticContextId;
  }
}
