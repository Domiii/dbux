import Trace from '@dbux/common/src/types/Trace';
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
    const { data } = dp.collections.staticTraces.getById(trace.staticTraceId);

    return data?.specialType || 0;
  }
}