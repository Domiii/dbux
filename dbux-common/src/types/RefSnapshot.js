/**
 * Represents a snapshot of a reference type object at a given point in time.
 */
export default class RefSnapshot {
  /**
   * 
   */
  nodeId;
  /**
   * Only set if {@link #value} is not set.
   */
  refId;
  /**
   * Only set if {@link #refId} is not set.
   */
  value;

  constructor(nodeId, refId, value) {
    this.nodeId = nodeId;
    this.refId = refId;
    this.value = value;
  }
}

export class RefSnapshotTreeNode extends RefSnapshot {
  /**
   * The key prop or index of parent object or array.
   * Or null if it was not constructed as part of a complete tree
   * 
   * @type {string | number | null}
   */
  key;

  /**
   * @type {Object<string, RefSnapshotTreeNode>? | Array<RefSnapshotTreeNode>?}
   */
  children;
}

export class VersionedRefSnapshot extends RefSnapshotTreeNode {
  terminateNodeId;
}


function makeSnapshotContainer(valueCategory) {
  // TODO
  // if (isArrayCategory(valueCategory)) {
  //   // array
  //   valueRef.childSnapshotsByKey = [];
  // }
  // else {
  //   // plain object
  //   valueRef.childSnapshotsByKey = {};
  // }
}
