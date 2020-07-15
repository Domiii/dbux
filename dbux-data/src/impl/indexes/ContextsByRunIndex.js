import ExecutionContext from '@dbux/common/src/core/data/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';

/** 
 * @param {DataProvider} dp
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