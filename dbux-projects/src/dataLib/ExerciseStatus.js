
import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let ExerciseStatus = {
  None: 1,
  Solving: 2,
  Attempted: 3,
  Found: 4,
  Solved: 5
};

ExerciseStatus = new Enum(ExerciseStatus);

export default ExerciseStatus;

const practicingTypes = new Array(ExerciseStatus.getValueMaxIndex()).map(() => false);
practicingTypes[ExerciseStatus.Solving] = true;
practicingTypes[ExerciseStatus.Attempted] = true;

export function isPracticingTypes(status) {
  return practicingTypes[status];
}

const passedTypes = new Array(ExerciseStatus.getValueMaxIndex()).map(() => false);
passedTypes[ExerciseStatus.Found] = true;
passedTypes[ExerciseStatus.Solved] = true;

export function isPassedTypes(status) {
  return passedTypes[status];
}