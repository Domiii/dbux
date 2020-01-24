import CollectionIndex from '../../indexes/CollectionIndex';

import Trace from 'dbux-common/src/core/data/Trace';
import TraceType from 'dbux-common/src/core/constants/TraceType';

import DataProvider from '../../DataProvider';

function makeKey(dp: DataProvider, trace: Trace) {
  const {
    contextId
  } = trace;

  return contextId;
}


export default class TracesByContextIndex extends CollectionIndex<Trace> {
  constructor() {
    super('traces', 'byContext');
  }

  makeKey = makeKey
}