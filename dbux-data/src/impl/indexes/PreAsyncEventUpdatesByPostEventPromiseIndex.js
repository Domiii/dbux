import AsyncEventUpdate from '@dbux/common/src/types/AsyncEventUpdate';
import AsyncEventUpdateType from '@dbux/common/src/types/constants/AsyncEventUpdateType';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';



/** @extends {CollectionIndex<AsyncEventUpdate>} */
export default class PreAsyncEventUpdatesByPostEventPromiseIndex extends CollectionIndex {
  constructor() {
    super('asyncEventUpdates', 'preUpdatesByPostEventPromise'/* , { isMap: true, containerCfg: { serializeKey: true } } */);
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {AsyncEventUpdate} asyncEvent
   */
  makeKey(dp, u) {
    if (AsyncEventUpdateType.is.PreThen(u.type)) {
      return u.postEventPromiseId;
    }
    if (AsyncEventUpdateType.is.PreAwait(u.type) && u.promiseId) {
      // NOTE: `u.promiseId` is not recorded, if the async function was called by the system
      return u.promiseId;
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
