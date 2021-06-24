import Trace from '@dbux/common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';


/** @extends {CollectionIndex<Trace>} */
export default class TracesBySpecialIdentifierTypeIndex extends CollectionIndex {
  constructor() {
    super('traces', 'bySpecialIdentifierType');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {Trace} trace
   */
  makeKey(dp, trace) {
    const { data } = dp.collections.staticContexts.getById(trace.staticTraceId);

    return data?.specialType || 0;
  }
}