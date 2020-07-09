import ExecutionContext from 'dbux-common/src/core/data/ExecutionContext';
import { isVirtualContextType } from 'dbux-common/src/core/constants/ExecutionContextType';
import Trace from 'dbux-common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


export default class ParentTracesInRealContextIndex extends CollectionIndex<Trace> {
  constructor() {
    super('traces', 'parentsByRealContext', false);
    this.addedTraces = new Set();
  }

  dependencies = {

    // NOTE: we are currently solving index dependencies by simply adding depdendents after dependees
    // indexes: [
    //   ['traces', 'byStaticTrace'],
    //   ['staticTraces', 'byFile']
    // ],

    /**
     * Find parent trace when a context is added
     */
    collections: {
      executionContexts: {
        added: (contexts: ExecutionContext[]) => {
          for (const context of contexts) {
            const { parentTraceId, contextType } = context;
            // skip parent trace of virtualContext
            if (isVirtualContextType(contextType)) {
              continue;
            }
            if (parentTraceId && !this.addedTraces.has(parentTraceId)) {
              this.addEntryById(parentTraceId);
              this.addedTraces.add(parentTraceId);
            }
          }
        }
      }
    }
  }

  makeKey(dp: DataProvider, { traceId }: Trace) {
    return dp.util.getRealContextId(traceId);
  }
}