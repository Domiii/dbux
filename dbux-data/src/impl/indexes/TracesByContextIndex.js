import Trace from '@dbux/common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** 
 * @param {RuntimeDataProvider} dp
 * @param {Trace} trace
 */
function makeKey(dp, trace) {
  const {
    contextId
  } = trace;

  return contextId;
}


/** @extends {CollectionIndex<Trace>} */
export default class TracesByContextIndex extends CollectionIndex {
  constructor() {
    super('traces', 'byContext');
  }

  makeKey = makeKey
}