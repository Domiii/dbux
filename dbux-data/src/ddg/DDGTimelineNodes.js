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
   * `timelineId` of children in order.
   * 
   * @type {Array.<number>}
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
  dataNodeId;
  label;

  /** ########################################
   * These fields are assigned in phase 4.
   * #######################################*/

  /**
   * Whether node is watched.
   */
  watched;
  nInputs;
  nOutputs;
}

export class PrimitiveTimelineNode extends DataTimelineNode {
  constructor(dataNodeId, label) {
    super(DDGTimelineNodeType.Primitive);

    this.dataNodeId = dataNodeId;
    this.label = label;
  }
}


/**
 * Snapshot of a ref value at time t = {@link SnapshotRefTimelineNode#dataNodeId.nodeId}.
 * NOTE: This is NOT a DataTimelineNode!
 */
export class SnapshotRefTimelineNode extends DDGTimelineNode {
  dataNodeId;

  /**
   * 
   */
  refId;
  
  label;
  
  // TODO: also represent the refNode itself (→ it needs to be addressable iff it has `declarationTid`)

  /**
   * Array or object of children ids ({@link DDGTimelineNode#timelineId}).
   * 
   * @type {Array.<number> | Object.<string, number>}
   */
  children;

  /**
   * @param {DataNode} dataNodeId 
   */
  constructor(dataNodeId, refId) {
    super(DDGTimelineNodeType.SnapshotRef);

    this.dataNodeId = dataNodeId;
    this.refId = refId;
  }
}


/** ###########################################################################
 * Decisions
 * ##########################################################################*/

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
