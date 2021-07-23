import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** @typedef { import("@dbux/common/src/types/AsyncEventUpdate").AsyncEventUpdate } AsyncEventUpdate */

/** @extends {CollectionIndex<AsyncEventUpdate>} */
export default class AsyncEventUpdatesByRootIndex extends CollectionIndex {
  constructor() {
    super('asyncEventUpdates', 'byRoot');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {AsyncEventUpdate} asyncEventUpdate
   */
  makeKey(dp, { rootId }) {
    return rootId;
  }
}