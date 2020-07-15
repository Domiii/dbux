import Trace from '@dbux/common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


export default class TracesByStaticTraceIndex extends CollectionIndex<Trace> {
  constructor() {
    super('traces', 'byStaticTrace');
  }

  makeKey(dp: DataProvider, trace: Trace) {
    const {
      staticTraceId
    } = trace;

    return staticTraceId;
  }
}