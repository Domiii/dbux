import AsyncEventUpdate from '@dbux/common/src/types/AsyncEventUpdate';
import { isPostOrResolveEventUpdate } from '@dbux/common/src/types/constants/AsyncEventUpdateType';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';



/** @extends {CollectionIndex<AsyncEventUpdate>} */
export default class PostAsyncEventUpdateByPromiseIndex extends CollectionIndex {
  constructor() {
    super('asyncEventUpdates', 'byPromise'/* , { isMap: true, containerCfg: { serializeKey: true } } */);
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {AsyncEventUpdate} asyncEvent
   */
  makeKey(dp, { type, promiseId }) {
    if (isPostOrResolveEventUpdate(type) && promiseId) {
      return promiseId;
    }

    // NOTE: POST or Resolve events do not have a `promiseId` 
    //      when an async function is called by the system, e.g.:
    //  1. type === PostAwait && the function itself is a then callback.
    //  2. type === PostThen && its callback is an async function.
    return false;
  }
}
