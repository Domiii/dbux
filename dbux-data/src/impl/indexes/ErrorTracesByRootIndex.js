import Trace from '@dbux/common/src/types/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';


/** @extends {CollectionIndex<Trace>} */
export default class ErrorTracesByRootIndex extends CollectionIndex {
  constructor() {
    super('traces', 'errorByRoot');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {Trace} trace
   */
  makeKey(dp, trace) {
    if (trace.error) {
      return trace.rootContextId;
    }
    return false;
  }
}