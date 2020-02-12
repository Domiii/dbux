import Trace from 'dbux-common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


export default class TracesByRunIdIndex extends CollectionIndex<Trace> {
  constructor() {
    super('traces', 'byRunId');
  }

  makeKey(dp: DataProvider, trace: Trace) {
    return trace.runId;
  }
}