import Trace from 'dbux-common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';


export default class ErrorTracesIndex extends CollectionIndex<Trace> {
  constructor() {
    super('traces', 'error');
  }

  makeKey(dp: DataProvider, trace: Trace) {
    if (trace.error) {
      return 1;
    }
    return false;
  }
}