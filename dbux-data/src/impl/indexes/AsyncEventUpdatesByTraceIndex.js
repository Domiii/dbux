import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** @typedef { import("@dbux/common/src/types/AsyncEventUpdate").AsyncEventUpdate } AsyncEventUpdate */

/** @extends {CollectionIndex<AsyncEventUpdate>} */
export default class AsyncEventUpdatesByTraceIndex extends CollectionIndex {
  constructor() {
    super('asyncEventUpdates', 'byTrace');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {AsyncEventUpdate} asyncEventUpdate
   */
  makeKey(dp, { schedulerTraceId }) {
    // if (!schedulerTraceId) {
    //   return false;
    // }
    return schedulerTraceId;
  }
}