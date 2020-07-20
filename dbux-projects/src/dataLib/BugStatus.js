
import Enum from 'dbux-common/src/util/Enum';

let BugStatus = {
  None: 1,
  Attempted: 2,
  Solved: 3,
};

BugStatus = new Enum(BugStatus);

export default BugStatus;