import Trace from '@dbux/common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';

/** 
 * @param {DataProvider} dp
 * @param {Trace} trace
 */
function makeKey(dp, trace) {
  const {
    valueId
  } = trace;
  if (!valueId) return false;
  const { trackId } = dp.collections.values.getById(valueId);

  return trackId || false;
}


/** @extends {CollectionIndex<Trace>} */
export default class TracesByTrackIdIndex extends CollectionIndex {
  constructor() {
    super('traces', 'byTrackId');
  }

  makeKey = makeKey
}