import CollectionIndex from '../../indexes/CollectionIndex';

/** @typedef {import('@dbux/common/src/types/DataNode').default} DataNode */

/** @extends {CollectionIndex<DataNode>} */
export default class DataNodesOutputsIndex extends CollectionIndex {
  /**
   * debug-only: Usually, indexes are partitions of underlying collections. This index is not.
   */
  manyToMany = true;

  constructor() {
    super('dataNodes', 'outputs', { isContainerSet: true });
  }

  /** 
   * @override
   * @param {DataNode} dataNode
   */
  addEntry(dataNode) {
    if (dataNode.inputs) {
      for (const inputNodeId of dataNode.inputs) {
        this.addEntryToKey(inputNodeId, dataNode);
      }
    }
  }
}
