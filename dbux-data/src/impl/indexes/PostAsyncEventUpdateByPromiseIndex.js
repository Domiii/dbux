import AsyncEventUpdate from '@dbux/common/src/types/AsyncEventUpdate';
import { isPostEventUpdate } from '@dbux/common/src/types/constants/AsyncEventUpdateType';
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
    if (isPostEventUpdate(type)) {
      return promiseId;
    }
    return undefined;
  }
}
