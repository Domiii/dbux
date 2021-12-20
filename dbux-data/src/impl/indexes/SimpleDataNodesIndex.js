import CollectionIndex from '../../indexes/CollectionIndex';
import RuntimeDataProvider from '../../RuntimeDataProvider';

/** @typedef {import('@dbux/common/src/types/DataNode').default} DataNode */

/** @extends {CollectionIndex<DataNode>} */
export default class SimpleDataNodesIndex extends CollectionIndex {
  constructor() {
    super('dataNodes', 'simple');
  }

  /** 
   * @param {RuntimeDataProvider} dp
   * @param {DataNode} dataNode
   */
  makeKey(dp, dataNode) {
    if (!dataNode.refId) {
      return 1;
    }
    else {
      return false;
    }
  }
}