import StaticTrace from 'dbux-common/src/core/data/StaticTrace';
import Trace from 'dbux-common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


export default class TracesByParentStaticContextIndex extends CollectionIndex<Trace> {
  constructor() {
    super('traces', 'byParentStaticContext');
  }

  makeKey(dp: DataProvider, trace: Trace) {
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