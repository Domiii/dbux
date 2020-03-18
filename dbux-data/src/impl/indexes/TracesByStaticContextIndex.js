import StaticTrace from 'dbux-common/src/core/data/StaticTrace';
import Trace from 'dbux-common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


export default class TracesByStaticContextIndex extends CollectionIndex<Trace> {
  constructor() {
    super('traces', 'byStaticContext');
  }

  makeKey(dp: DataProvider, trace: Trace) {
    // funnily enough, this won't work for `Resume` contexts - TODO: make sure that staticTrace.staticContextId is the same as in context
    // const { staticTraceId } = trace;
    // const staticTrace = dp.collections.staticTraces.getById(staticTraceId);
    // return staticTrace.staticContextId;

    const { contextId } = trace;
    const context = dp.collections.executionContexts.getById(contextId);
    return context.staticContextId;
  }
}