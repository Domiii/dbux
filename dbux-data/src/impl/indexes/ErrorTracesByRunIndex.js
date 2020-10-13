import Trace from '@dbux/common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';


/** @extends {CollectionIndex<Trace>} */
export default class ErrorTracesByRunIndex extends CollectionIndex {
  constructor() {
    super('traces', 'errorByRun');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {Trace} trace
   */
  makeKey(dp, trace) {
    if (trace.error) {
      return trace.runId;
    }
    return false;
  }
}