import Trace from '@dbux/common/src/types/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** 
 * @param {RuntimeDataProvider} dp
 * @param {Trace} trace
 */
function makeKey(dp, trace) {
  const { contextId } = trace;
  const callerTraceId = dp.util.getCallerTraceOfContext(contextId)?.traceId;

  return callerTraceId || false;
}


/** @extends {CollectionIndex<Trace>} */
export default class TracesByCalleeTraceIndex extends CollectionIndex {
  constructor() {
    super('traces', 'byCalleeTrace');
  }

  makeKey = makeKey
}