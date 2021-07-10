import AsyncEvent from '@dbux/common/src/core/data/AsyncEvent';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';



/** @extends {CollectionIndex<AsyncEvent>} */
export default class AsyncEventsToIndex extends CollectionIndex {
  constructor() {
    super('asyncEvents', 'to');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {AsyncEvent} asyncEvent
   */
  makeKey(dp, { fromRootContextId }) {
    return fromRootContextId;
  }
}