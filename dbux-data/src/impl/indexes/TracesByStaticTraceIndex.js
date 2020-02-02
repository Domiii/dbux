import Trace from 'dbux-common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';

function makeKey(dp: DataProvider, trace: Trace) {
  const {
    staticTraceId
  } = trace;

  return staticTraceId;
}


export default class TracesByStaticTraceIndex extends CollectionIndex<Trace> {
  constructor() {
    super('traces', 'byStaticTrace');
  }

  makeKey = makeKey
}