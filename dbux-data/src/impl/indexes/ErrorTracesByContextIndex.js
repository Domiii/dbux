import Trace from '@dbux/common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


export default class ErrorTracesByContextIndex extends CollectionIndex<Trace> {
  constructor() {
    super('traces', 'errorByContext');
  }

  makeKey(dp: DataProvider, trace: Trace) {
    if (trace.error) {
      return trace.contextId;
    }
    return false;
  }
}