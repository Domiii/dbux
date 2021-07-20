import Trace from '@dbux/common/src/types/Trace';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/**
 * @extends {CollectionIndex<Trace>}
 */
export default class ErrorTracesIndex extends CollectionIndex {
  constructor() {
    super('traces', 'error');
  }

  /**
   * @param {RuntimeDataProvider} dp 
   * @param {Trace} trace 
   */
  makeKey(dp, trace) {
    if (trace.error) {
      return 1;
    }
    return false;
  }
}