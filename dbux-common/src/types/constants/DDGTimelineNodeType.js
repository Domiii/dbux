import Enum from '../../util/Enum';

const ddgTimelineNodeTypeObj = {
  Root: 1,

  // single value
  Value: 2,

  RefSnapshot: 3,
  RepeatedRef: 4,
  DeleteEntry: 5,

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

  Iteration: 20,

  Hof: 25
};

/**
 * @type {(Enum|typeof ddgTimelineNodeTypeObj)}
 */
const DDGTimelineNodeType = new Enum(ddgTimelineNodeTypeObj);

/** @typedef { ddgTimelineNodeTypeObj[keyof ddgTimelineNodeTypeObj] } DDGTimelineNodeTypeValues */


// const containerNodeTypes = [...controlGroupTypes];
// export function isContainerNodeType(timelineNodeType) {
//   return containerNodeTypes[timelineNodeType] || false;
// }


const dataTimelineNodeTypes = new Array(DDGTimelineNodeType.getValueMaxIndex()).map(() => false);
dataTimelineNodeTypes[DDGTimelineNodeType.Value] = true;
dataTimelineNodeTypes[DDGTimelineNodeType.Decision] = true;
dataTimelineNodeTypes[DDGTimelineNodeType.DeleteEntry] = true;

/**
 * 
 */
export function isDataTimelineNode(timelineNodeType) {
  return dataTimelineNodeTypes[timelineNodeType] || false;
}

const hasDataTimelineNodeTypes = new Array(DDGTimelineNodeType.getValueMaxIndex()).map(() => false);
hasDataTimelineNodeTypes[DDGTimelineNodeType.Value] = true;
hasDataTimelineNodeTypes[DDGTimelineNodeType.Decision] = true;
hasDataTimelineNodeTypes[DDGTimelineNodeType.RefSnapshot] = true;
hasDataTimelineNodeTypes[DDGTimelineNodeType.DeleteEntry] = true;

/**
 * Applies to `DataTimelineNode`s and snapshot nodes (which contain data).
 * NOTE: Both have `dataNodeId`.
 */
export function doesTimelineNodeCarryData(timelineNodeType) {
  return hasDataTimelineNodeTypes[timelineNodeType] || false;
}

export function isSnapshotTimelineNode(timelineNodeType) {
  return DDGTimelineNodeType.is.RefSnapshot(timelineNodeType);
}

const refTypes = new Array(DDGTimelineNodeType.getValueMaxIndex()).map(() => false);
refTypes[DDGTimelineNodeType.RefSnapshot] = true;
refTypes[DDGTimelineNodeType.RepeatedRef] = true;
export function isRefTimelineNode(timelineNodeType) {
  return refTypes[timelineNodeType] || false;
}

export function isRepeatedRefTimelineNode(timelineNodeType) {
  return DDGTimelineNodeType.is.RepeatedRef(timelineNodeType);
}


/** ###########################################################################
 * group + branch node utils
 * ##########################################################################*/


const loopTypes = new Array(DDGTimelineNodeType.getValueMaxIndex()).map(() => false);
loopTypes[DDGTimelineNodeType.For] = true;
loopTypes[DDGTimelineNodeType.ForIn] = true;
loopTypes[DDGTimelineNodeType.ForOf] = true;
loopTypes[DDGTimelineNodeType.While] = true;
loopTypes[DDGTimelineNodeType.DoWhile] = true;
export function isLoopTimelineNode(groupType) {
  return loopTypes[groupType] || false;
}

const controlGroupTypes = [...loopTypes];
controlGroupTypes[DDGTimelineNodeType.Root] = true;
controlGroupTypes[DDGTimelineNodeType.Context] = true;
controlGroupTypes[DDGTimelineNodeType.Hof] = true;

controlGroupTypes[DDGTimelineNodeType.If] = true;
controlGroupTypes[DDGTimelineNodeType.Ternary] = true;
controlGroupTypes[DDGTimelineNodeType.SwitchCase] = true;

controlGroupTypes[DDGTimelineNodeType.Iteration] = true;
export function isControlGroupTimelineNode(timelineNodeType) {
  return controlGroupTypes[timelineNodeType] || false;
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

export function isDecisionNode(nodeType) {
  return DDGTimelineNodeType.is.Decision(nodeType);
}

export default DDGTimelineNodeType;
