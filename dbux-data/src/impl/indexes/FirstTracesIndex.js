import Trace from '@dbux/common/src/core/data/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import DataProvider from '../../DataProvider';

/** @extends {CollectionIndex<Trace>} */
export default class FirstTracesIndex extends CollectionIndex {
  constructor() {
    super('traces', 'firsts');
    this.addedRun = [];
  }

  /** 
   * @param {DataProvider} dp
   * @param {Trace} trace
   */
  makeKey(dp, trace) {
    if (!this.addedRun[trace.runId]) {
      this.addedRun[trace.runId] = true;
      return 1;
    }
    return false;
  }
}