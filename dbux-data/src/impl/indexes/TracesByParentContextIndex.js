import Trace from '@dbux/common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';

/** 
 * @param {DataProvider} dp
 * @param {Trace} trace
 */
function makeKey(dp, trace) {
  const { parentContextId } = dp.collections.executionContexts.getById(trace.contextId);

  return parentContextId || 0;
}


/** @extends {CollectionIndex<Trace>} */
export default class TracesByParentContextIndex extends CollectionIndex {
  constructor() {
    super('traces', 'byParentContext');
  }

  makeKey = makeKey
}