import ExecutionContext from '@dbux/common/src/core/data/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** 
 * This collects all contexts that should be list as a root in run
 * @extends {CollectionIndex<ExecutionContext>}
 */
export default class RootContextsByRunIndex extends CollectionIndex {
  constructor() {
    super('executionContexts', 'rootsByRun');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {ExecutionContext} context
   */
  makeKey(dp, context) {
    const { contextId, runId } = context;
    if (!dp.util.isRootContextInRun(contextId)) {
      return false;
    }
    return runId;
  }
}