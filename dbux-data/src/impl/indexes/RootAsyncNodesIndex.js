import AsyncNode from '@dbux/common/src/types/AsyncNode';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';



/**
 * NOTE: depends on `AsyncEventsToIndex`
 * @extends {CollectionIndex<AsyncNode>}
 * */
export default class RootAsyncNodesIndex extends CollectionIndex {
  constructor() {
    super('asyncNodes', 'roots', { addOnNewData: false });
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {AsyncNode} asyncNode
   */
  makeKey(dp, { rootContextId }) {
    if (dp.indexes.asyncEvents.to.getFirst(rootContextId)) {
      return false;
    }
    return 1;
  }
}