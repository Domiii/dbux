// import DDGTimelineNodeType from './DDGTimelineNodeType';

import DDGTimelineNodeType from './DDGTimelineNodeType';

/** @typedef { import("./DDGTimelineNodeType").DDGTimelineNodeTypeValues } DDGTimelineNodeTypeValues */

export class DDGTimelineNode {
  /**
   * @type {DDGTimelineNodeTypeValues}
   */
  type;

  /**
   * @type {number}
   */
  timelineId;

  /**
   * @type {Array.<DDGTimelineNode>?}
   */
  children;

  /**
   * @param {DDGTimelineNodeTypeValues} type
   */
  constructor(type) {
    this.type = type;
  }

  toString() {
    const props = { ...this };
    delete props.children;
    return `[${DDGTimelineNodeType.nameFrom(this.type)}] ${JSON.stringify(props, null, 2)}`;
  }
}

export class BaseDataTimelineNode extends DDGTimelineNode {
  dataNode;
  label;

  /**
   * Whether node is watched.
   */
  watched;
  nInputs;
  nOutputs;
}

export class PrimitiveTimelineNode extends BaseDataTimelineNode {
  constructor() {
    super(DDGTimelineNodeType.Primitive);
  }
}

export class DecisionTimelineNode extends BaseDataTimelineNode {
  // TODO
}

// TODO: contains more SnapshotRef and/or SnapshotPrimitive nodes?
export class SnapshotRootTimelineNode extends BaseDataTimelineNode {
  dataNode;

  /**
   * @type {DDGSnapshotNode | DDGNode}
   */
  children = []; // TODO!?

  /**
   * @param {DataNode} dataNode 
   */
  constructor(dataNode) {
    super(DDGTimelineNodeType.Snapshot);

    this.dataNode = dataNode;
  }
}


export class ContextTimelineNode extends DDGTimelineNode {
  contextId;

  constructor(contextId) {
    super(DDGTimelineNodeType.Context);
    this.contextId = contextId;
    this.children = [];
  }
}

export class BranchTimelineNode extends DDGTimelineNode {

}
