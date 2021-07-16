import StaticTrace from '@dbux/common/src/types/StaticTrace';
import Trace from '@dbux/common/src/types/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';


/** @extends {CollectionIndex<Trace>} */
export default class TracesByParentStaticContextIndex extends CollectionIndex {
  constructor() {
    super('traces', 'byParentStaticContext');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {Trace} trace
   */
  makeKey(dp, trace) {
    // funnily enough, this won't work for `Resume` contexts - TODO: make sure that staticTrace.staticContextId is the same as in context
    // const { staticTraceId } = trace;
    // const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    // return staticTrace.staticContextId;

    const { contextId } = trace;
    const context = dp.collections.executionContexts.getById(contextId);
    const staticContext = dp.collections.staticContexts.getById(context.staticContextId);
    const parentStaticContextId = staticContext.parentId;

    // const parentStaticContext = dp.collections.staticContexts.getById(parentStaticContextId);
    
    return parentStaticContextId || 0;
  }
}