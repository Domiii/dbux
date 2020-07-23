import Enum from '@dbux/common/src/util/Enum';

let BugRunnerStatus = {
  None: 1,
  Busy: 2,
  RunningInBackground: 3,
  Done: 4
};

BugRunnerStatus = new Enum(BugRunnerStatus);

export default BugRunnerStatus;

const runningTypes = new Array(BugRunnerStatus.getValueMaxIndex()).map(() => false);
runningTypes[BugRunnerStatus.Busy] = true;
runningTypes[BugRunnerStatus.RunningInBackground] = true;

export function isStatusRunningType(statusType) {
  return runningTypes[statusType];
}