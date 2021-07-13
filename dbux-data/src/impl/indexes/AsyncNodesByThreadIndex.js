import AsyncNode from '@dbux/common/src/core/data/AsyncNode';
import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';



/** @extends {CollectionIndex<AsyncNode>} */
export default class AsyncNodesByThreadIndex extends CollectionIndex {
  constructor() {
    super('asyncNodes', 'byThread');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {AsyncNode} asyncNode
   */
  makeKey(dp, { threadId }) {
    return threadId;
  }
}