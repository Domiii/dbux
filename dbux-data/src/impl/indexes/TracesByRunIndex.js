import Trace from 'dbux-common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


export default class TracesByRunIndex extends CollectionIndex<Trace> {
  constructor() {
    super('traces', 'byRun');
  }

  makeKey(dp: DataProvider, trace: Trace) {
    return trace.runId;
  }
}