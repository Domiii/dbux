/**
 * Represents a snapshot of a reference type object at a given point in time.
 */
export default class RefSnapshot {
  /**
   * 
   */
  childNodeId;
  /**
   * Only set if {@link #value} is not set.
   */
  childRefId;
  /**
   * Only set if {@link #refId} is not set.
   */
  childValue;

  constructor(nodeId, refId, value) {
    this.childNodeId = nodeId;
    this.childRefId = refId;
    this.childValue = value;
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
   * @type {Object<string, RefSnapshotTreeNode>?}
   */
  childrenByKey;
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
