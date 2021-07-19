import AsyncEvent from '@dbux/common/src/types/AsyncEvent';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';



/** @extends {CollectionIndex<AsyncEvent>} */
export default class AsyncEventUpdateByNestedPromiseIndex extends CollectionIndex {
  constructor() {
    super('asyncEventUpdates', 'byNestedPromise', { isMap: true });
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {AsyncEvent} asyncEvent
   */
  makeKey(dp, { runId, nestedPromiseId }) {
    return { runId, nestedPromiseId };
  }
}