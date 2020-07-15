import StaticTrace from '@dbux/common/src/core/data/StaticTrace';
import Trace from '@dbux/common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


/** @extends {CollectionIndex<Trace>} */
export default class TracesByStaticContextIndex extends CollectionIndex {
  constructor() {
    super('traces', 'byStaticContext');
  }

  /** 
   * @param {DataProvider} dp
   * @param {Trace} trace
   */
  makeKey(dp, trace) {
    const { contextId } = trace;
    const context = dp.collections.executionContexts.getById(contextId);
    return context.staticContextId;
  }
}