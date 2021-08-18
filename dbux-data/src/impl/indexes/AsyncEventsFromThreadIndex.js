import CollectionIndex from '../../indexes/CollectionIndex';

/** @typedef {import('@dbux/common/src/types/AsyncEvent').default} AsyncEvent */
/** @typedef {import('../../RuntimeDataProvider').default} RuntimeDataProvider */

/** @extends {CollectionIndex<AsyncEvent>} */
export default class AsyncEventsFromThreadIndex extends CollectionIndex {
  constructor() {
    super('asyncEvents', 'fromThread');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {AsyncEvent} asyncEvent
   */
  makeKey(dp, asyncEvent) {
    return dp.util.getAsyncRootThreadId(asyncEvent.fromRootContextId);
  }
}