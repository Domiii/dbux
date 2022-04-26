import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let PracticeSessionState = {
  // Activating: 1,
  Solving: 2,
  Stopped: 3,
  Found: 4,
  Solved: 5
};

PracticeSessionState = new Enum(PracticeSessionState);

export default PracticeSessionState;

const FoundedTypes = new Array(PracticeSessionState.getValueMaxIndex()).map(() => false);
FoundedTypes[PracticeSessionState.Found] = true;
FoundedTypes[PracticeSessionState.Solved] = true;

export function isStateFoundedType(sessionType) {
  return FoundedTypes[sessionType];
}

const StoppedTypes = new Array(PracticeSessionState.getValueMaxIndex()).map(() => false);
StoppedTypes[PracticeSessionState.Stopped] = true;
StoppedTypes[PracticeSessionState.Solved] = true;

export function isStateStoppedType(sessionType) {
  return StoppedTypes[sessionType];
}

export function isStateFinishedType(sessionType) {
  return sessionType >= 3;
}
