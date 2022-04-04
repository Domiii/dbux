import ExecutionContext from '@dbux/common/src/types/ExecutionContext';
import ExecutionContextType from '@dbux/common/src/types/constants/ExecutionContextType';
import Trace from '@dbux/common/src/types/Trace';
import CollectionIndex, { CollectionIndexDependencies } from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';


/**
 * NOTE: used for navigation to find "next child context's trace"
 * 
 * @extends {CollectionIndex<Trace>}
 */
export default class ParentTracesInRealContextIndex extends CollectionIndex {
  constructor() {
    super('traces', 'parentsByRealContext', { addOnNewData: false });
    this.addedTraces = new Set();
  }

  /**
   * @type { CollectionIndexDependencies }
   */
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
        /**
         * @param {ExecutionContext[]} contexts
         */
        added: (contexts) => {
          for (const context of contexts) {
            const { parentTraceId, contextType } = context;
            // skip await contexts
            if (ExecutionContextType.is.Await(contextType)) {
              continue;
            }

            /**
             * NOTE: this will filter out non-first virtual contexts, since they have no `parentTraceId`
             */
            if (parentTraceId && !this.addedTraces.has(parentTraceId)) {
              this.addEntryById(parentTraceId);
              this.addedTraces.add(parentTraceId);
            }
          }
        }
      }
    }
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {Trace} { traceId }
   */
  makeKey(dp, { traceId }) {
    return dp.util.getRealContextIdOfTrace(traceId);
  }
}