
import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let BugStatus = {
  None: 1,
  Solving: 2,
  Attempted: 3,
  Found: 4,
  Solved: 5
};

BugStatus = new Enum(BugStatus);

export default BugStatus;

const practicingTypes = new Array(BugStatus.getValueMaxIndex()).map(() => false);
practicingTypes[BugStatus.Solving] = true;
practicingTypes[BugStatus.Attempted] = true;

export function isPracticingTypes(status) {
  return practicingTypes[status];
}