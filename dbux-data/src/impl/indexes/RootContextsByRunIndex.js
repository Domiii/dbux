import ExecutionContext from '@dbux/common/src/core/data/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** @extends {CollectionIndex<ExecutionContext>} */
export default class RootContextsByRunIndex extends CollectionIndex {
  constructor() {
    super('executionContexts', 'rootsByRun');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {ExecutionContext} context
   */
  makeKey(dp, context) {
    if (context.parentContextId) return false;
    return context.runId;
  }
}