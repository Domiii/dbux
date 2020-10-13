import Trace from '@dbux/common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


/** @extends {CollectionIndex<Trace>} */
export default class TracesByStaticTraceIndex extends CollectionIndex {
  constructor() {
    super('traces', 'byStaticTrace');
  }

  beforeAdd(ofKey, trace) {
    trace.staticTraceIndex = ofKey.length;
  }

  /** 
   * @param {DataProvider} dp
   * @param {Trace} trace
   */
  makeKey(dp, trace) {
    const {
      staticTraceId
    } = trace;

    return staticTraceId;
  }
}