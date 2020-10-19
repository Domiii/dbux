import StaticTrace from '@dbux/common/src/core/data/StaticTrace';
import Trace from '@dbux/common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';


/** @extends {CollectionIndex<StaticTrace>} */
export default class ExecutedStaticTracesByFileIndex extends CollectionIndex {
  /**
   * @type {boolean[]}
   */
  visited = [];

  constructor() {
    super('staticTraces', 'visitedByFile', { addOnNewData: false });
  }

  dependencies = {
    // NOTE: we are currently solving index dependencies by simply adding depdendents after dependees
    // indexes: [
    //   ['traces', 'byStaticTrace'],
    //   ['staticTraces', 'byFile']
    // ],

    collections: {
      traces: {
        /**
         * @param {Trace[]} traces
         */
        added: (traces) => {
          for (const trace of traces) {
            const { staticTraceId } = trace;
            if (!this.visited[staticTraceId]) {
              // a new trace has been executed
              this.addEntryById(staticTraceId);
            }
          }
        }
      }
    }
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {StaticTrace} staticTrace
   */
  makeKey(dp, staticTrace) {
    const { staticTraceId } = staticTrace;
    // const traces = dp.indexes.traces.byStaticTrace.get(staticTraceId);
    // if (traces) {
    //   // filter out
    //   return false;
    // }

    this.visited[staticTraceId] = true;
    return dp.util.getStaticTraceProgramId(staticTraceId);
  }
}