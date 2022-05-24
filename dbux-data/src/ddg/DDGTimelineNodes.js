// import DDGTimelineNodeType from './DDGTimelineNodeType';

import last from 'lodash/last';
import DDGTimelineNodeType from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import SyntaxType from '@dbux/common/src/types/constants/SyntaxType';

/** @typedef { import("@dbux/common/src/types/constants/DDGTimelineNodeType").DDGTimelineNodeTypeValues } DDGTimelineNodeTypeValues */

export class DDGTimelineNode {
  /**
   * @type {DDGTimelineNodeTypeValues}
   */
  type;

  /**
   * @type {number}
   */
  timelineId;

  label;

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
  connected = false;

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
 * Snapshot of a ref value at time t = {@link RefSnapshotTimelineNode#dataNodeId.nodeId}.
 * NOTE: This is NEITHER DataTimelineNode NOR GroupTimelineNode!
 */
export class RefSnapshotTimelineNode extends DDGTimelineNode {
  dataNodeId;

  /**
   * @type {number}
   */
  refId;

  /**
   * @type {string}
   */
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
    super(DDGTimelineNodeType.RefSnapshot);

    this.dataNodeId = dataNodeId;
    this.refId = refId;
  }
}


/** ###########################################################################
 * Decisions
 * ##########################################################################*/

export class DecisionTimelineNode extends DataTimelineNode {
  constructor(dataNodeId, label) {
    super(DDGTimelineNodeType.Decision);

    this.dataNodeId = dataNodeId;
    this.label = label;
  }
}

/** ###########################################################################
 * Control group nodes
 * ##########################################################################*/

export class ContextTimelineNode extends GroupTimelineNode {
  contextId;

  constructor(contextId, label) {
    super(DDGTimelineNodeType.Context);
    this.contextId = contextId;
    this.label = label;
    this.children = [];
  }
}


export class BranchTimelineNode extends GroupTimelineNode {
  controlStatementId;

  /**
   * DataTimelineId of `decision` nodes.
   * @type {number[]}
   */
  decisions;

  constructor(type, controlStatementId) {
    super(type);
    this.controlStatementId = controlStatementId;
    this.children = [];
    this.decisions = [];
  }
}

export class IfTimelineNode extends BranchTimelineNode {
  constructor(controlStatementId) {
    super(DDGTimelineNodeType.If, controlStatementId);
  }

  addDecision(decisionTimelineId) {
    this.decisions.push(decisionTimelineId);
  }
}

// TODO: loops and more
