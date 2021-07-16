import ExecutionContext from '@dbux/common/src/types/ExecutionContext';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** 
 * @param {RuntimeDataProvider} dp
 * @param {ExecutionContext} context
 */
function makeKey(dp, context) {
  return context.contextType;
}


/** @extends {CollectionIndex<ExecutionContext>} */
export default class ContextsByTypeIndex extends CollectionIndex {
  constructor() {
    super('executionContexts', 'byType');
  }

  makeKey = makeKey
}