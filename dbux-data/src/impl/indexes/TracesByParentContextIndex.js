import Trace from '@dbux/common/src/types/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** 
 * @param {RuntimeDataProvider} dp
 * @param {Trace} trace
 */
function makeKey(dp, trace) {
  const context = dp.collections.executionContexts.getById(trace.contextId);

  return context?.parentContextId || 0;
}


/** @extends {CollectionIndex<Trace>} */
export default class TracesByParentContextIndex extends CollectionIndex {
  constructor() {
    super('traces', 'byParentContext');
  }

  makeKey = makeKey
}