import Enum from '../../util/Enum';

const controlGroupTypeObj = {
  Context: 1,
  If: 2,
  Ternary: 3,
  SwitchCase: 4,
  For: 5,
  ForIn: 6,
  ForOf: 7,
  While: 8,
  DoWhile: 9,
  Root: 12
};
/**
 * @type {(Enum|typeof controlGroupTypeObj)}
 */
const ControlGroupType = new Enum(controlGroupTypeObj);
export default ControlGroupType;

const loopTypes = new Array(ControlGroupType.getValueMaxIndex()).map(() => false);
loopTypes[ControlGroupType.For] = true;
loopTypes[ControlGroupType.ForIn] = true;
loopTypes[ControlGroupType.ForOf] = true;
loopTypes[ControlGroupType.While] = true;
loopTypes[ControlGroupType.DoWhile] = true;
export function isLoopControlGroupType(groupType) {
  return loopTypes[groupType];
}

const firstIterationUnconditionalTypes = new Array(ControlGroupType.getValueMaxIndex()).map(() => false);
firstIterationUnconditionalTypes[ControlGroupType.DoWhile] = true;
export function isFirstIterationUnconditionalControlGroupType(groupType) {
  return firstIterationUnconditionalTypes[groupType];
}

const unconditionalTypes = new Array(ControlGroupType.getValueMaxIndex()).map(() => false);
unconditionalTypes[ControlGroupType.Context] = true;
unconditionalTypes[ControlGroupType.Root] = true;
export function isUnconditionalControlGroupType(groupType) {
  return unconditionalTypes[groupType];
}
