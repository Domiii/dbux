import AsyncEvent from '@dbux/common/src/types/AsyncEvent';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';



/** 
 * 
 * @extends {CollectionIndex<AsyncEvent>}
 */
export default class AsyncEventsFromIndex extends CollectionIndex {
  constructor() {
    super('asyncEvents', 'from');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {AsyncEvent} asyncEvent
   */
  makeKey(dp, { fromRootContextId }) {
    return fromRootContextId;
  }
}