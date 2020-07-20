
import Enum from 'dbux-common/src/util/Enum';

const bugResultStatusType = new Enum({
  None: 1,
  Attempted: 2,
  Solved: 3,
});

export default bugResultStatusType;