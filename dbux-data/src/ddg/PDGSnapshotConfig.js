import DataNode from '@dbux/common/src/types/DataNode';
import { RefSnapshotTimelineNode } from './PDGTimelineNodes';

/**
 * Recurds and allows customizing snapshot creation.
 */
export default class PDGSnapshotConfig {
  /**
   * @type {SnapshotMap?} snapshotsByRefId If provided, helps keep track of all snapshots of a set.
   */
  snapshotsByRefId = new Map();

  /**
   * @type {(parentSnapshot: RefSnapshotTimelineNode, childDataNodeId: DataNode) => boolean?}
   */
  shouldBuildDeep;

  nodeBuilt;
}


