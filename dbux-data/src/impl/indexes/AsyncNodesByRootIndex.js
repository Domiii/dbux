import AsyncNode from '@dbux/common/src/types/AsyncNode';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';



/** @extends {CollectionIndex<AsyncNode>} */
export default class AsyncNodesByRootIndex extends CollectionIndex {
  constructor() {
    super('asyncNodes', 'byRoot');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {AsyncNode} asyncNode
   */
  makeKey(dp, { rootContextId }) {
    return rootContextId;
  }
}