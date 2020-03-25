import Trace from 'dbux-common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';

function makeKey(dp: DataProvider, trace: Trace) {
  const { contextId } = trace;
  const { parentTraceId = false } = dp.collections.executionContexts.getById(contextId);

  return parentTraceId;
}


export default class TracesByParentTraceIndex extends CollectionIndex<Trace> {
  constructor() {
    super('traces', 'byParentTrace');
  }

  makeKey = makeKey
}