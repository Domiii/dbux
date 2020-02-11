import Trace from 'dbux-common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';

function makeKey(dp: DataProvider, trace: Trace) {
  const lastTraceRunId = dp.collections.traces.getById(trace.traceId - 1)?.runId;
  if (!lastTraceRunId) return 1;
  if (lastTraceRunId !== trace.runId) return 1;
  return false;
}


export default class RootTracesIndex extends CollectionIndex<Trace> {
  constructor() {
    super('traces', 'roots');
  }

  makeKey = makeKey
}