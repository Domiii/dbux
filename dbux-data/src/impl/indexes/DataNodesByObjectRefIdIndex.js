import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** @typedef {import('@dbux/common/src/core/data/DataNode').default} DataNode */

/** 
 * Indexed by dataNode.varAccess.objectTid's refId
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
    const objectTid = dataNode.varAccess?.objectTid;
    if (objectTid) {
      const objectTrace = dp.collections.traces.getById(objectTid);
      const objectDataNode = dp.collections.dataNodes.getById(objectTrace.nodeId);
      return objectDataNode.refId;
    }
    return false;
  }
}