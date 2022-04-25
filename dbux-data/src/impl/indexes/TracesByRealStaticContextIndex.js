import Trace from '@dbux/common/src/types/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';


/** @extends {CollectionIndex<Trace>} */
export default class TracesByRealStaticContextIndex extends CollectionIndex {
  constructor() {
    super('traces', 'byRealStaticContext');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {Trace} trace
   */
  makeKey(dp, trace) {
    const { contextId } = trace;
    const realContextId = dp.util.getRealStaticContextIdOfContext(contextId);

    return realContextId || 0;
  }
}