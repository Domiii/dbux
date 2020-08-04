
import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let BugStatus = {
  None: 1,
  Attempted: 2,
  Solved: 3,
};

BugStatus = new Enum(BugStatus);

export default BugStatus;