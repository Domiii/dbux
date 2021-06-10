import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** @typedef {import('@dbux/common/src/core/data/DataNode').default} DataNode */

/** @extends {CollectionIndex<DataNode>} */
export default class DataNodesByRefIdIndex extends CollectionIndex {
  constructor() {
    super('dataNodes', 'byRefId');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {DataNode} dataNode
   */
  makeKey(dp, dataNode) {
    return dataNode.refId || false;
  }
}