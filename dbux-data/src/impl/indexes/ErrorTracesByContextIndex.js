import Trace from 'dbux-common/src/core/data/Trace';
import Trace from 'dbux-common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


export default class ErrorTracesByContextIndex extends CollectionIndex<Trace> {
  visited: boolean[] = [];

  constructor() {
    super('traces', 'errorsByContext', false);
  }

  dependencies = {
    // NOTE: we are currently solving index dependencies by simply adding depdendents after dependees
    // indexes: [
    //   ['traces', 'byStaticTrace'],
    //   ['staticTraces', 'byFile']
    // ],

    collections: {
      traces: {
        added: (traces: Trace[]) => {
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

  makeKey(dp: DataProvider, trace: Trace) {
    const {
      traceId
    } = trace;

    const traceType = dp.util.getTraceType(traceId);
    this.visited[traceId] = true;

    return !isReturnTrace(traceType) && !isTracePop(traceType) &&   // return and pop traces indicate that there was no error in that context
      dp.util.isLastTraceInContext(traceId) &&        // is last trace we have recorded
      !dp.util.isLastTraceInStaticContext(traceId);   // but is not last trace in the code

    return dp.util.getStaticTraceProgramId(staticTraceId);
  }
}