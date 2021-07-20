import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** @typedef {import('@dbux/common/src/types/DataNode').default} DataNode */

/** @extends {CollectionIndex<DataNode>} */
export default class DataNodesByAccessIdIndex extends CollectionIndex {
  constructor() {
    super('dataNodes', 'byAccessId', { addOnNewData: false });
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {DataNode} dataNode
   */
  makeKey(dp, dataNode) {
    return dataNode.accessId || false;
  }
}