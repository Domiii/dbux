/**
 * Represents a snapshot of a reference type object at a given point in time.
 */
export default class RefSnapshot {
  /**
   * @type {number}
   */
  refId;

  /**
   * Id of `DataNode` that captured the first instance of this reference.
   * @type {number}
   */
  nodeId;

  /**
   * Raw value of ref.
   * If this instanceof `ValueRef`: `#value` usually only exists if something went wrong when recording the reference value.
   * Else: (this is a child snapshot): `#value` is mutually exclusive with `#refId`.
   */
  value;

  /**
   * @type {Object<string, RefSnapshotTreeNode>? | Array<RefSnapshotTreeNode>?}
   */
  children;

  constructor(nodeId, refId, value) {
    this.nodeId = nodeId;
    this.refId = refId;
    this.value = value;
  }

  getChildValue(childKey) {
    return this.children[childKey]?.value;
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
}



export class VersionedRefSnapshot extends RefSnapshotTreeNode {
  terminateNodeId;
}



function makeSnapshotContainer(valueCategory) {
  // TODO
  // if (isArrayCategory(valueCategory)) {
  //   // array
  //   valueRef.children = [];
  // }
  // else {
  //   // plain object
  //   valueRef.children = {};
  // }
}
