import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** @typedef {import('@dbux/common/src/types/DataNode').default} DataNode */

/** @extends {CollectionIndex<DataNode>} */
export default class DataNodesByValueIdIndex extends CollectionIndex {
  constructor() {
    super('dataNodes', 'byValueId', { addOnNewData: false });
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {DataNode} dataNode
   */
  makeKey(dp, dataNode) {
    return dataNode.valueId || false;
  }
}