import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

export default class TracesByTypeIndex extends CollectionIndex {
  constructor() {
    super('traces', 'byType');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {Trace} trace
   */
  makeKey(dp, trace) {
    return dp.util.getTraceType(trace.traceId) || false;
  }
}