import Trace from 'dbux-common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';

function makeKey(dp: DataProvider, trace: Trace) {
  const {
    valueId
  } = trace;
  if (!valueId) return false;
  const { trackId } = dp.collections.values.getById(valueId);

  return trackId || false;
}


export default class TracesByTrackIdIndex extends CollectionIndex<Trace> {
  constructor() {
    super('traces', 'byTrackId');
  }

  makeKey = makeKey
}