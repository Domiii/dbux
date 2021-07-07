import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** @typedef {import('@dbux/common/src/core/data/DataNode').default} DataNode */

/** 
 * Indexed by dataNode.varAccess.objctNodeId's refId
 * @extends {CollectionIndex<DataNode>}
 */
export default class DataNodesByObjectRefIdIndex extends CollectionIndex {
  constructor() {
    super('dataNodes', 'byObjectRefId');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {DataNode} dataNode
   */
  makeKey(dp, dataNode) {
    const objectNodeId = dataNode.varAccess?.objectNodeId;
    if (objectNodeId) {
      const objectDataNode = dp.collections.dataNodes.getById(objectNodeId);
      return objectDataNode.refId;
    }
    return false;
  }
}