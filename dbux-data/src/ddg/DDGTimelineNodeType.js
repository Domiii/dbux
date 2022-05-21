import Enum from '@dbux/common/src/util/Enum';

const DDGTimelineNodeTypeObj = {
  Root: 1,

  // simple data
  Data: 2,

  // decision
  Decision: 3,

  // snapshot (special type of Data node)
  Snapshot: 4,

  // context
  Context: 5,

  // conditionals
  If: 6,
  Ternary: 7,
  SwitchCase: 8,

  For: 9,
  ForIn: 10,
  ForOf: 11,
  While: 12,
  DoWhile: 13
};

/**
 * @type {(Enum|typeof DDGTimelineNodeTypeObj)}
 */
const DDGTimelineNodeType = new Enum(DDGTimelineNodeTypeObj);

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
  return controlGroupTypes[timelineNodeType];
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
