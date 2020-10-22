import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let PathwaysMode = {
  Normal: 0,
  Analyze: 1
};

PathwaysMode = new Enum(PathwaysMode);

export default PathwaysMode;