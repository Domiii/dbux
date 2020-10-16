import ExecutionContext from '@dbux/common/src/core/data/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** 
 * @param {RuntimeDataProvider} dp
 * @param {ExecutionContext} context
 */
function makeKey(dp, context) {
  if (context.parentContextId) return false;
  return 1;
}


/** @extends {CollectionIndex<ExecutionContext>} */
export default class RootContextsIndex extends CollectionIndex {
  constructor() {
    super('executionContexts', 'roots');
  }

  makeKey = makeKey
}