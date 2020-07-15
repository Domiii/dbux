import Trace from '@dbux/common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


export default class ErrorTracesByRunIndex extends CollectionIndex<Trace> {
  constructor() {
    super('traces', 'errorByRun');
  }

  makeKey(dp: DataProvider, trace: Trace) {
    if (trace.error) {
      return trace.runId;
    }
    return false;
  }
}