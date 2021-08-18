import CollectionIndex from '../../indexes/CollectionIndex';

/** @typedef {import('@dbux/common/src/types/AsyncEvent').default} AsyncEvent */
/** @typedef {import('../../RuntimeDataProvider').default} RuntimeDataProvider */

/** @extends {CollectionIndex<AsyncEvent>} */
export default class AsyncEventsFromThreadIndex extends CollectionIndex {
  constructor() {
    super('asyncEvents', 'toThread');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {AsyncEvent} asyncEvent
   */
  makeKey(dp, asyncEvent) {
    /**
     * TODO: preAwait edges are not completed yet, disable these edges for now
     * @see AsyncEventUpdateCollection.preAwait
     */
    return dp.util.getAsyncRootThreadId(asyncEvent.toRootContextId) || false;
  }
}