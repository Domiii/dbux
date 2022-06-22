// import DDGTimelineNodeType from './DDGTimelineNodeType';

import DDGTimelineNodeType from '@dbux/common/src/types/constants/DDGTimelineNodeType';
import { DDGRootTimelineId } from './constants';
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
   * Only for nodes in a snapshot tree: `timelineId` of this node's parent node.
   * (does not apply to groups. Use `groupId` instead.)
   * @type {number}
   */
  parentNodeId;

  /**
   * Whether there are any writes to a ref's props or an outside variable in this node.
   * This is needed to build `summaryNodes`.
   */
  hasSummarizableWrites = false;

  /**
   * Whether this is an "og" node (i.e. created during original graph construction),
   * that is part of the base timeline,
   * or whether it was added later (usually due to summarization).
   * @type {boolean}
   */
  og;

  groupId;

  // some other data that we can make use of
  traceType;

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
   * `traceId` that caused this group to be pushed.
   */
  pushTid;

  /**
   * `timelineId` of children in order.
   * 
   * @type {Array.<number>}
   */
  children = [];

  /**
   * {@link DecisionTimelineNode#TimelineId} of this branch's decision nodes.
   * @type {number[]}
   */
  decisions = [];
}

/**
 * Unique outer-most group node.
 * The root holds the entire DDG.
 */
export class TimelineRoot extends GroupTimelineNode {
  constructor() {
    super(DDGTimelineNodeType.Root);
    this.timelineId = DDGRootTimelineId;
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
  /**
   * `timelineId` of the root `RefSnapshotTimelineNode`.
   */
  rootTimelineId;
  value;
  connected = false;

  /** ########################################
   * These fields are assigned in phase 4.
   * #######################################*/

  /**
   * Whether node is watched.
   */
  watched;
}

export class ValueTimelineNode extends DataTimelineNode {
  prop;

  constructor(dataNodeId, label) {
    super(DDGTimelineNodeType.Value);

    this.dataNodeId = dataNodeId;
    this.label = label;
  }
}

/**
 * future-work: this is actually now basically a `DataTimelineNode`. Need to integrate the two.
 * This node represents a ref value at time t = {@link RefTimelineNode#dataNodeId}.
 */
export class RefTimelineNode extends DDGTimelineNode {
  traceId;
  dataNodeId;

  /**
   * @type {number}
   */
  refId;

  /**
   * @param {number} dataNodeId 
   */
  constructor(type, traceId, dataNodeId, refId) {
    super(type);
    this.traceId = traceId;
    this.dataNodeId = dataNodeId;
    this.refId = refId;
  }
}


export class DeleteEntryTimelineNode extends DataTimelineNode {
  constructor(dataNodeId, label) {
    super(DDGTimelineNodeType.DeleteEntry);

    this.dataNodeId = dataNodeId;
    this.label = label;
  }
}

// export class SnapshotEntryDeleteInfo {
//   prop;
//   dataNodeId;
// }

export class RefSnapshotTimelineNode extends RefTimelineNode {
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
   * `timelineId` of the root `RefSnapshotTimelineNode`.
   */
  rootTimelineId;

  /**
   * Whether this is only a partial snapshot
   */
  isPartial = false;

  /**
   * @param {number} dataNodeId 
   */
  constructor(traceId, dataNodeId, refId) {
    super(DDGTimelineNodeType.RefSnapshot, traceId, dataNodeId, refId);
  }
}

/**
 * 
 */
export class RepeatedRefTimelineNode extends RefTimelineNode {
  /**
   * @type {string}
   */
  label = '🔃';

  /**
   * The `timelineId` of the {@link RefSnapshotTimelineNode} that this is a repition of.
   */
  repeatedTimelineId;

  /**
   * @param {number} dataNodeId 
   */
  constructor(traceId, dataNodeId, refId, originalTimelineId) {
    super(DDGTimelineNodeType.RepeatedRef, traceId, dataNodeId, refId);
    this.repeatedTimelineId = originalTimelineId;
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

  constructor(type, controlStatementId) {
    super(type);
    this.controlStatementId = controlStatementId;
    this.children = [];
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
  /**
   * The how many'th iteration of parent loop.
   */
  i;

  constructor(decisionTimelineId, i) {
    super(DDGTimelineNodeType.Iteration);
    this.decision = decisionTimelineId;
    this.i = i;
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
