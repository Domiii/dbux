import Trace from '@dbux/common/src/types/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';


/** @extends {CollectionIndex<Trace>} */
export default class TracesByRealContextIndex extends CollectionIndex {
  constructor() {
    super('traces', 'byRealContext');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {Trace} { traceId }
   */
  makeKey(dp, { traceId }) {
    return dp.util.getRealContextIdOfTrace(traceId);
  }
}