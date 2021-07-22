import AsyncEventUpdate from '@dbux/common/src/types/AsyncEventUpdate';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';



/** @extends {CollectionIndex<AsyncEventUpdate>} */
export default class AsyncEventUpdatesByNestedPromiseAndRunIndex extends CollectionIndex {
  constructor() {
    super('asyncEventUpdates', 'byNestedPromiseAndRun', { isMap: true, containerCfg: { serializeKey: true } });
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {AsyncEventUpdate} asyncEventUpdate
   */
  makeKey(dp, { runId, nestedPromiseId }) {
    if (!nestedPromiseId) {
      return false;
    }
    return [runId, nestedPromiseId];
  }
}