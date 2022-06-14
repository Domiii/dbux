import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** @typedef {import('@dbux/common/src/types/DataNode').default} DataNode */

/** 
 * Indexed by dataNode.varAccess.objctNodeId's refId
 * @extends {CollectionIndex<DataNode>}
 */
export default class DataNodesByObjectNodeIdIndex extends CollectionIndex {
  constructor() {
    super('dataNodes', 'byObjectNodeId');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {DataNode} dataNode
   */
  makeKey(dp, dataNode) {
    return dataNode.varAccess?.objectNodeId || false;
  }
}