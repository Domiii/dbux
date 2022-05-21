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

export class BaseDataTimeLineNode extends DDGTimelineNode {
  dataNode;
  label;

  /**
   * Whether node is watched.
   */
  watched;
  nInputs;
  nOutputs;
}

export class DataTimelineNode extends BaseDataTimeLineNode {
}

export class DecisionTimelineNode extends BaseDataTimeLineNode {
  // TODO
}

export class SnapshotRootTimelineNode extends BaseDataTimeLineNode {
  // TODO: contains more SnapshotRef and/or SnapshotPrimitive nodes
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
