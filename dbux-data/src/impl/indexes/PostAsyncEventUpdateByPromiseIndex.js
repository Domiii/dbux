import AsyncEventUpdate from '@dbux/common/src/types/AsyncEventUpdate';
// import { isPostEventUpdate } from '@dbux/common/src/types/constants/AsyncEventUpdateType';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';



/** @extends {CollectionIndex<AsyncEventUpdate>} */
export default class AsyncEventUpdatesByPromiseIndex extends CollectionIndex {
  constructor() {
    super('asyncEventUpdates', 'byPromise'/* , { isMap: true, containerCfg: { serializeKey: true } } */);
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {AsyncEventUpdate} asyncEvent
   */
  makeKey(dp, { type, promiseId }) {
    if (/* isPostEventUpdate(type) && */ promiseId) {
      return promiseId;
    }

    // NOTE: POST or Resolve events do not have a `promiseId` 
    //      when an async function because it is a then callback, leading to two situations:
    //      where the promiseId is missing
    //  1. type === PostAwait inside the then callback.
    //  2. type === PostThen and its prePromise is a then callback.
    //  TODO: link up in PromisePatcher?
    return false;
  }
}
