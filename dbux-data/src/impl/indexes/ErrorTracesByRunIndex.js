import Trace from '@dbux/common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


/** @extends {CollectionIndex<Trace>} */
export default class ErrorTracesByRunIndex extends CollectionIndex {
  constructor() {
    super('traces', 'errorByRun');
  }

  /** 
   * @param {DataProvider} dp
   * @param {Trace} trace
   */
  makeKey(dp, trace) {
    if (trace.error) {
      return trace.runId;
    }
    return false;
  }
}