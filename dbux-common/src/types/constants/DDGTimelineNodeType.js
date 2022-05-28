import Enum from '../../util/Enum';

const ddgTimelineNodeTypeObj = {
  Root: 1,

  // primitive data
  Primitive: 2,

  RefSnapshot: 3,

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
  DoWhile: 17,

  Iteration: 20
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
controlGroupTypes[DDGTimelineNodeType.Iteration] = true;
export function isControlGroupTimelineNode(timelineNodeType) {
  return controlGroupTypes[timelineNodeType] || false;
}

// const containerNodeTypes = [...controlGroupTypes];
// export function isContainerNodeType(timelineNodeType) {
//   return containerNodeTypes[timelineNodeType] || false;
// }


const dataTimelineNodeTypes = new Array(DDGTimelineNodeType.getValueMaxIndex()).map(() => false);
dataTimelineNodeTypes[DDGTimelineNodeType.Primitive] = true;
dataTimelineNodeTypes[DDGTimelineNodeType.Decision] = true;

/**
 * 
 */
export function isDataTimelineNode(timelineNodeType) {
  return dataTimelineNodeTypes[timelineNodeType] || false;
}

const hasDataTimelineNodeTypes = new Array(DDGTimelineNodeType.getValueMaxIndex()).map(() => false);
hasDataTimelineNodeTypes[DDGTimelineNodeType.Primitive] = true;
hasDataTimelineNodeTypes[DDGTimelineNodeType.Decision] = true;
hasDataTimelineNodeTypes[DDGTimelineNodeType.RefSnapshot] = true;

/**
 * Applies to `DataTimelineNode`s and snapshot nodes (which contain data).
 * NOTE: Both have `dataNodeId`.
 */
export function doesTimelineNodeHaveData(timelineNodeType) {
  return hasDataTimelineNodeTypes[timelineNodeType] || false;
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


export function isLoopIterationTimelineNode(groupType) {
  return DDGTimelineNodeType.is.Iteration(groupType);
}

const firstIterationUnconditionalTypes = new Array(DDGTimelineNodeType.getValueMaxIndex()).map(() => false);
firstIterationUnconditionalTypes[DDGTimelineNodeType.DoWhile] = true;

/**
 * NOTE: control flow of DoWhile is rather different from all other loops
 */
export function isFirstIterationUnconditional(groupType) {
  return firstIterationUnconditionalTypes[groupType];
}

const unconditionalTypes = new Array(DDGTimelineNodeType.getValueMaxIndex()).map(() => false);
unconditionalTypes[DDGTimelineNodeType.Context] = true;
unconditionalTypes[DDGTimelineNodeType.Root] = true;

/**
 * These control groups don't have decisions attached to them.
 */
export function isUnconditionalGroup(groupType) {
  return unconditionalTypes[groupType];
}

export default DDGTimelineNodeType;
