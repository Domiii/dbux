import AsyncEventUpdate from '@dbux/common/src/types/AsyncEventUpdate';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';



/** @extends {CollectionIndex<AsyncEventUpdate>} */
export default class AsyncEventUpdatesByNestedPromiseIndex extends CollectionIndex {
  constructor() {
    super('asyncEventUpdates', 'byNestedPromise');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {AsyncEventUpdate} asyncEventUpdate
   */
  makeKey(dp, { nestedPromiseId }) {
    if (!nestedPromiseId) {
      return false;
    }
    return nestedPromiseId;
  }
}