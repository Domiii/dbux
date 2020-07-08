import Enum from 'dbux-common/src/util/Enum';

const CodeEventType = new Enum({
  Login: 1,
  Command: 2,
  Timer: 3
});

export const SubEventTypes = new Enum({
  [CodeEventType.Timer]: {
    Start: 1,
    Pause: 2,
    Resume: 3,
    Finish: 4,
    GiveUp: 5
  }
});

export default CodeEventType;