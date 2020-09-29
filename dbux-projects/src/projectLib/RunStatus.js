import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let RunStatus = {
  None: 1,
  Busy: 2,
  RunningInBackground: 3,
  Done: 4
};

RunStatus = new Enum(RunStatus);

export default RunStatus;

const runningTypes = new Array(RunStatus.getValueMaxIndex()).map(() => false);
runningTypes[RunStatus.Busy] = true;
runningTypes[RunStatus.RunningInBackground] = true;

export function isStatusRunningType(statusType) {
  return runningTypes[statusType];
}