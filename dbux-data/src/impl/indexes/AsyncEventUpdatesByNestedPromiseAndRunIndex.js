import AsyncEventUpdate from '@dbux/common/src/types/AsyncEventUpdate';
import CollectionIndex from '../../indexes/CollectionIndex';



/** @extends {CollectionIndex<AsyncEventUpdate>} */
export default class AsyncEventUpdatesByNestedPromiseAndRunIndex extends CollectionIndex {
  constructor() {
    super('asyncEventUpdates', 'byNestedPromiseAndRun', { isMap: true, containerCfg: { serializeKey: true } });
  }

  /**
   * @override
   * @param {AsyncEventUpdate} asyncEventUpdate
   */
  addEntry(asyncEventUpdate) {
    const { runId, nestedPromiseId } = asyncEventUpdate;
    if (!nestedPromiseId) {
      return;
    }

    const key = [runId, nestedPromiseId];
    this.addEntryToKey(key, asyncEventUpdate);
  }
}
