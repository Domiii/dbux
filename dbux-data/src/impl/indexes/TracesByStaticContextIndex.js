import StaticTrace from '@dbux/common/src/core/data/StaticTrace';
import Trace from '@dbux/common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


export default class TracesByStaticContextIndex extends CollectionIndex<Trace> {
  constructor() {
    super('traces', 'byStaticContext');
  }

  makeKey(dp: DataProvider, trace: Trace) {
    const { contextId } = trace;
    const context = dp.collections.executionContexts.getById(contextId);
    return context.staticContextId;
  }
}