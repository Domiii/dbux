import Trace from '@dbux/common/src/types/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';


/** @extends {CollectionIndex<Trace>} */
export default class TracesByFileIndex extends CollectionIndex {
  constructor() {
    super('traces', 'byFile');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {Trace} trace
   */
  makeKey(dp, trace) {
    const programId = dp.util.getTraceProgramId(trace.traceId);
    if (!programId) {
      this.logger.warn(`makeKey failed to getTraceProgramId for trace: ${dp.util.makeTraceInfo(trace)}`);
    }
    return programId;
  }
}