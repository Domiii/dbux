import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** @typedef {import('@dbux/common/src/types/DataNode').default} DataNode */

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
    return dp.util.getDataNodeAccessedRefId(dataNode.nodeId) || false;
  }
}