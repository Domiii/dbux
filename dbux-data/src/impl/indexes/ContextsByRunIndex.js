import ExecutionContext from '@dbux/common/src/types/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** 
 * @param {RuntimeDataProvider} dp
 * @param {ExecutionContext} context
 */
function makeKey(dp, context) {
  return context.runId;
}


/** @extends {CollectionIndex<ExecutionContext>} */
export default class ContextsByRunIndex extends CollectionIndex {
  constructor() {
    super('executionContexts', 'byRun');
  }

  makeKey = makeKey
}