import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let PracticeSessionState = {
  Activating: 1,
  Solving: 2,
  Solved: 3
};

PracticeSessionState = new Enum(PracticeSessionState);

export default PracticeSessionState;