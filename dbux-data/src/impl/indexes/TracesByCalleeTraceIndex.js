import Trace from 'dbux-common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';

function makeKey(dp: DataProvider, trace: Trace) {
  const { contextId } = trace;
  const calleeTraceId = dp.util.getCalleeTraceOfContext(contextId);

  return calleeTraceId || false;
}


export default class TracesByCalleeTraceIndex extends CollectionIndex<Trace> {
  constructor() {
    super('traces', 'byCalleeTrace');
  }

  makeKey = makeKey
}