import Trace from '@dbux/common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


/** @extends {CollectionIndex<Trace>} */
export default class TracesByFileIndex extends CollectionIndex {
  constructor() {
    super('traces', 'byFile');
  }

  /** 
   * @param {DataProvider} dp
   * @param {Trace} trace
   */
  makeKey(dp, trace) {
    return dp.util.getTraceProgramId(trace.traceId);
  }
}