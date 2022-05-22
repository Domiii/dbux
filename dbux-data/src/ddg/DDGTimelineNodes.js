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

export class GroupTimelineNode extends DDGTimelineNode {
  /**
   * @type {Array.<DDGTimelineNode>}
   */
  children = [];
}

/**
 * Unique outer-most group node.
 * The root holds the entire DDG.
 */
export class TimelineRoot extends GroupTimelineNode {
  constructor() {
    super(DDGTimelineNodeType.Root);
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

export class SnapshotTimelineNode extends DataTimelineNode {
}


/**
 * Can represent primitive or ref.
 */
export class SnapshotRefTimelineNode extends SnapshotTimelineNode {
  refId;
  
  // TODO: also represent the refNode itself

  /**
   * @type {SnapshotTimelineNode[]}
   */
  children;

  /**
   * @param {DataNode} dataNode 
   */
  constructor(dataNode) {
    super(DDGTimelineNodeType.SnapshotRef);

    this.dataNode = dataNode;
  }
}


/**
 * Can represent primitive or ref.
 */
export class SnapshotPrimitiveTimelineNode extends SnapshotTimelineNode {
  /**
   * @param {DataNode} dataNode 
   */
  constructor(dataNode) {
    super(DDGTimelineNodeType.SnapshotPrimitive);

    this.dataNode = dataNode;
  }
}


export class DecisionTimelineNode extends DataTimelineNode {
  // TODO
}

/** ###########################################################################
 * Control group nodes
 * ##########################################################################*/

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
