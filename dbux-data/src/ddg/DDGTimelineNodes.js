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

/** ###########################################################################
 * {@link DataTimelineNode}
 * ##########################################################################*/

export class DataTimelineNode extends DDGTimelineNode {
  dataTimelineId;
  dataNode;
  label;

  /**
   * Whether node is watched.
   */
  watched;
  nInputs;
  nOutputs;
}

export class PrimitiveTimelineNode extends DataTimelineNode {
  constructor(dataNode, label) {
    super(DDGTimelineNodeType.Primitive);

    this.dataNode = dataNode;
    this.label = label;
  }
}

export class DecisionTimelineNode extends DataTimelineNode {
  // TODO
}


/**
 * Can represent primitive or ref.
 */
export class SnapshotTimelineNode extends DataTimelineNode {
  refId;

  /**
   * @type {SnapshotTimelineNode[]?}
   */
  children;
}


/** ###########################################################################
 * Group nodes
 * ##########################################################################*/

export class GroupTimelineNode extends DDGTimelineNode {
  /**
   * @type {Array.<DDGTimelineNode>}
   */
  children = [];
}

export class RootTimelineNode extends GroupTimelineNode {
  constructor() {
    super(DDGTimelineNodeType.Root);
  }
}

export class SnapshotRootTimelineNode extends GroupTimelineNode {
  dataNode;

  /**
   * @type {DDGSnapshotPrimitiveNode | DDGSnapshotRefNode}
   */
  children = []; // TODO!?

  /**
   * @param {DataNode} dataNode 
   */
  constructor(dataNode) {
    super(DDGTimelineNodeType.SnapshotRoot);

    this.dataNode = dataNode;
  }
}


export class ContextTimelineNode extends GroupTimelineNode {
  contextId;

  constructor(contextId) {
    super(DDGTimelineNodeType.Context);
    this.contextId = contextId;
    this.children = [];
  }
}

export class BranchTimelineNode extends GroupTimelineNode {
  // TODO
}

// TODO: loops, decisions etc.
