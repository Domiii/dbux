import Enum from '@dbux/common/src/util/Enum';

const ddgTimelineNodeTypeObj = {
  Root: 1,

  // primitive data
  Primitive: 2,

  SnapshotRef: 4,
  SnapshotPrimitive: 5,

  // decision (Data node for control decisions)
  Decision: 8,

  // context
  Context: 9,

  // conditionals
  If: 10,
  Ternary: 11,
  SwitchCase: 12,

  For: 13,
  ForIn: 14,
  ForOf: 15,
  While: 16,
  DoWhile: 17
};

/**
 * @type {(Enum|typeof ddgTimelineNodeTypeObj)}
 */
const DDGTimelineNodeType = new Enum(ddgTimelineNodeTypeObj);

/** @typedef { DDGTimelineNodeTypeObj[keyof DDGTimelineNodeTypeObj] } DDGTimelineNodeTypeValues */


const controlGroupTypes = new Array(DDGTimelineNodeType.getValueMaxIndex()).map(() => false);
controlGroupTypes[DDGTimelineNodeType.Root] = true;
controlGroupTypes[DDGTimelineNodeType.Context] = true;
controlGroupTypes[DDGTimelineNodeType.If] = true;
controlGroupTypes[DDGTimelineNodeType.Ternary] = true;
controlGroupTypes[DDGTimelineNodeType.SwitchCase] = true;
controlGroupTypes[DDGTimelineNodeType.For] = true;
controlGroupTypes[DDGTimelineNodeType.ForIn] = true;
controlGroupTypes[DDGTimelineNodeType.ForOf] = true;
controlGroupTypes[DDGTimelineNodeType.While] = true;
controlGroupTypes[DDGTimelineNodeType.DoWhile] = true;
export function isControlGroupTimelineNode(timelineNodeType) {
  return controlGroupTypes[timelineNodeType] || false;
}

const containerNodeTypes = [...controlGroupTypes];
containerNodeTypes[DDGTimelineNodeType.SnapshotRef] = true;
export function isContainerNodeType(timelineNodeType) {
  return containerNodeTypes[timelineNodeType] || false;
}


const dataTimelineNodeTypes = new Array(DDGTimelineNodeType.getValueMaxIndex()).map(() => false);
dataTimelineNodeTypes[DDGTimelineNodeType.Primitive] = true;
dataTimelineNodeTypes[DDGTimelineNodeType.SnapshotPrimitive] = true;
dataTimelineNodeTypes[DDGTimelineNodeType.SnapshotRef] = true;
dataTimelineNodeTypes[DDGTimelineNodeType.Decision] = true;

/**
 * These are the nodes that are actually linked.
 */
export function isBasicDataTimelineNode(timelineNodeType) {
  return dataTimelineNodeTypes[timelineNodeType] || false;
}


const loopTypes = new Array(DDGTimelineNodeType.getValueMaxIndex()).map(() => false);
loopTypes[DDGTimelineNodeType.For] = true;
loopTypes[DDGTimelineNodeType.ForIn] = true;
loopTypes[DDGTimelineNodeType.ForOf] = true;
loopTypes[DDGTimelineNodeType.While] = true;
loopTypes[DDGTimelineNodeType.DoWhile] = true;
export function isLoopTimelineNode(groupType) {
  return loopTypes[groupType];
}

const firstIterationUnconditionalTypes = new Array(DDGTimelineNodeType.getValueMaxIndex()).map(() => false);
firstIterationUnconditionalTypes[DDGTimelineNodeType.DoWhile] = true;

/**
 * NOTE: control flow of DoWhile is rather different from all other loops
 */
export function isFirstIterationUnconditionalTimelineNode(groupType) {
  return firstIterationUnconditionalTypes[groupType];
}

const unconditionalTypes = new Array(DDGTimelineNodeType.getValueMaxIndex()).map(() => false);
unconditionalTypes[DDGTimelineNodeType.Context] = true;
unconditionalTypes[DDGTimelineNodeType.Root] = true;
export function isUnconditionalTimelineNode(groupType) {
  return unconditionalTypes[groupType];
}

export default DDGTimelineNodeType;
