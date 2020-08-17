
import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let BugStatus = {
  None: 1,
  Solving: 2,
  Attempted: 3,
  Solved: 4,
};

BugStatus = new Enum(BugStatus);

export default BugStatus;