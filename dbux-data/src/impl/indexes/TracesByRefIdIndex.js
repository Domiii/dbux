import Trace from '@dbux/common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** 
 * @param {RuntimeDataProvider} dp
 * @param {Trace} trace
 */
function makeKey(dp, trace) {
  const {
    refId
  } = trace;
  
  return refId || false;
}


/** @extends {CollectionIndex<Trace>} */
export default class TracesByRefIdIndex extends CollectionIndex {
  constructor() {
    super('dataNodes', 'byRefId');
  }

  makeKey = makeKey
}