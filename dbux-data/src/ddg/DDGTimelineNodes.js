// import DDGTimelineNodeType from './DDGTimelineNodeType';

import DDGTimelineNodeType from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import { RootTimelineId } from './constants';
// import SyntaxType from '@dbux/common/src/types/constants/SyntaxType';

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

  /**
   * @type {string}
   */
  label;

  /**
   * Whether there are any writes to a ref's props happening in this node.
   */
  hasRefWriteNodes = false;

  /**
   * Set of `timelineId`s of {@link RefSnapshotTimelineNode} in this node.
   * Is built lazily in `buildNodeDetails`.
   * @type {Array.<number>?}
   */
  refWriteNodes;

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
    this.timelineId = RootTimelineId;
  }
}


/** ###########################################################################
 * {@link DataTimelineNode}
 * ##########################################################################*/

export class DataTimelineNode extends DDGTimelineNode {
  /**
   * @type {number}
   */
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
 * Snapshot of a ref value at time t = {@link RefSnapshotTimelineNode#dataNodeId}.
 * NOTE: This is NEITHER DataTimelineNode NOR GroupTimelineNode!
 */
export class RefSnapshotTimelineNode extends DDGTimelineNode {
  traceId;
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
  constructor(traceId, dataNodeId, refId) {
    super(DDGTimelineNodeType.RefSnapshot);

    this.traceId = traceId;
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
   * {@link DecisionTimelineNode#TimelineId} of this branch's decision nodes.
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
}

export class TernaryTimelineNode extends BranchTimelineNode {
  constructor(controlStatementId) {
    super(DDGTimelineNodeType.Ternary, controlStatementId);
  }
}

export class SwitchTimelineNode extends BranchTimelineNode {
  constructor(controlStatementId) {
    super(DDGTimelineNodeType.Switch, controlStatementId);
  }
}

/** ###########################################################################
 * loops
 * ##########################################################################*/

export class IterationNode extends GroupTimelineNode {
  /**
   * {@link DecisionTimelineNode#timelineId} of this iteration's decision node.
   */
  decision;

  constructor(decisionTimelineId) {
    super(DDGTimelineNodeType.Iteration);
    this.decision = decisionTimelineId;
  }
}

/**
 * NOTE: `children` of loops are iterations
 */
export class LoopTimelineNode extends GroupTimelineNode {
  controlStatementId;

  constructor(type, controlStatementId) {
    super(type);
    this.controlStatementId = controlStatementId;
  }
}


export class ForTimelineNode extends LoopTimelineNode {
  constructor(controlStatementId) {
    super(DDGTimelineNodeType.For, controlStatementId);
  }
}
export class ForInTimelineNode extends LoopTimelineNode {
  constructor(controlStatementId) {
    super(DDGTimelineNodeType.ForIn, controlStatementId);
  }
}
export class ForOfTimelineNode extends LoopTimelineNode {
  constructor(controlStatementId) {
    super(DDGTimelineNodeType.ForOf, controlStatementId);
  }
}
export class WhileTimelineNode extends LoopTimelineNode {
  constructor(controlStatementId) {
    super(DDGTimelineNodeType.While, controlStatementId);
  }
}
export class DoWhileTimelineNode extends LoopTimelineNode {
  constructor(controlStatementId) {
    super(DDGTimelineNodeType.DoWhile, controlStatementId);
  }
}
