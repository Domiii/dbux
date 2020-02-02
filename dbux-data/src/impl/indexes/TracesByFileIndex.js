import Trace from 'dbux-common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


export default class TracesByFileIndex extends CollectionIndex<Trace> {
  constructor() {
    super('traces', 'byFile');
  }

  makeKey(dp: DataProvider, trace: Trace) {
    return dp.util.getTraceProgramId(trace.traceId);
  }
}