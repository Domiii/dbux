import Trace from 'dbux-common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';

export default class FirstTracesIndex extends CollectionIndex<Trace> {
  constructor() {
    super('traces', 'firsts');
    this.addedRun = [];
  }

  makeKey = (dp: DataProvider, trace: Trace) => {
    if (!this.addedRun[trace.runId]) {
      this.addedRun[trace.runId] = true;
      return 1;
    }
    return false;
  }
}