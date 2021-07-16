import Trace from '@dbux/common/src/types/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** @extends {CollectionIndex<Trace>} */
export default class FirstTracesIndex extends CollectionIndex {
  constructor() {
    super('traces', 'firsts');
    this.addedRun = [];
  }

  /** 
   * @param {RuntimeDataProvider} dp
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