import Enum from '../../util/Enum';

const pdgTimelineNodeTypeObj = {
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
 * @type {(Enum|typeof pdgTimelineNodeTypeObj)}
 */
const PDGTimelineNodeType = new Enum(pdgTimelineNodeTypeObj);

/** @typedef { pdgTimelineNodeTypeObj[keyof pdgTimelineNodeTypeObj] } PDGTimelineNodeTypeValues */


// const containerNodeTypes = [...controlGroupTypes];
// export function isContainerNodeType(timelineNodeType) {
//   return containerNodeTypes[timelineNodeType] || false;
// }


const dataTimelineNodeTypes = new Array(PDGTimelineNodeType.getValueMaxIndex()).map(() => false);
dataTimelineNodeTypes[PDGTimelineNodeType.Value] = true;
dataTimelineNodeTypes[PDGTimelineNodeType.Decision] = true;
dataTimelineNodeTypes[PDGTimelineNodeType.DeleteEntry] = true;

/**
 * 
 */
export function isDataTimelineNode(timelineNodeType) {
  return dataTimelineNodeTypes[timelineNodeType] || false;
}

const hasDataTimelineNodeTypes = new Array(PDGTimelineNodeType.getValueMaxIndex()).map(() => false);
hasDataTimelineNodeTypes[PDGTimelineNodeType.Value] = true;
hasDataTimelineNodeTypes[PDGTimelineNodeType.Decision] = true;
hasDataTimelineNodeTypes[PDGTimelineNodeType.RefSnapshot] = true;
hasDataTimelineNodeTypes[PDGTimelineNodeType.DeleteEntry] = true;

/**
 * Applies to `DataTimelineNode`s and snapshot nodes (which contain data).
 * NOTE: Both have `dataNodeId`.
 */
export function doesTimelineNodeCarryData(timelineNodeType) {
  return hasDataTimelineNodeTypes[timelineNodeType] || false;
}

export function isSnapshotTimelineNode(timelineNodeType) {
  return PDGTimelineNodeType.is.RefSnapshot(timelineNodeType);
}

const refTypes = new Array(PDGTimelineNodeType.getValueMaxIndex()).map(() => false);
refTypes[PDGTimelineNodeType.RefSnapshot] = true;
refTypes[PDGTimelineNodeType.RepeatedRef] = true;
export function isRefTimelineNode(timelineNodeType) {
  return refTypes[timelineNodeType] || false;
}

export function isRepeatedRefTimelineNode(timelineNodeType) {
  return PDGTimelineNodeType.is.RepeatedRef(timelineNodeType);
}


/** ###########################################################################
 * group + branch node utils
 * ##########################################################################*/


const loopTypes = new Array(PDGTimelineNodeType.getValueMaxIndex()).map(() => false);
loopTypes[PDGTimelineNodeType.For] = true;
loopTypes[PDGTimelineNodeType.ForIn] = true;
loopTypes[PDGTimelineNodeType.ForOf] = true;
loopTypes[PDGTimelineNodeType.While] = true;
loopTypes[PDGTimelineNodeType.DoWhile] = true;
export function isLoopTimelineNode(groupType) {
  return loopTypes[groupType] || false;
}

const controlGroupTypes = [...loopTypes];
controlGroupTypes[PDGTimelineNodeType.Root] = true;
controlGroupTypes[PDGTimelineNodeType.Context] = true;
controlGroupTypes[PDGTimelineNodeType.Hof] = true;

controlGroupTypes[PDGTimelineNodeType.If] = true;
controlGroupTypes[PDGTimelineNodeType.Ternary] = true;
controlGroupTypes[PDGTimelineNodeType.SwitchCase] = true;

controlGroupTypes[PDGTimelineNodeType.Iteration] = true;
export function isControlGroupTimelineNode(timelineNodeType) {
  return controlGroupTypes[timelineNodeType] || false;
}


export function isLoopIterationTimelineNode(groupType) {
  return PDGTimelineNodeType.is.Iteration(groupType);
}

const firstIterationUnconditionalTypes = new Array(PDGTimelineNodeType.getValueMaxIndex()).map(() => false);
firstIterationUnconditionalTypes[PDGTimelineNodeType.DoWhile] = true;

/**
 * NOTE: control flow of DoWhile is rather different from all other loops
 */
export function isFirstIterationUnconditional(groupType) {
  return firstIterationUnconditionalTypes[groupType];
}

const unconditionalTypes = new Array(PDGTimelineNodeType.getValueMaxIndex()).map(() => false);
unconditionalTypes[PDGTimelineNodeType.Context] = true;
unconditionalTypes[PDGTimelineNodeType.Root] = true;

/**
 * These control groups don't have decisions attached to them.
 */
export function isUnconditionalGroup(groupType) {
  return unconditionalTypes[groupType];
}

export function isDecisionNode(nodeType) {
  return PDGTimelineNodeType.is.Decision(nodeType);
}

export default PDGTimelineNodeType;
