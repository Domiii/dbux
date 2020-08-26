import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let GraphThemeMode = {
  Light: 1,
  Dark: 2
};

GraphThemeMode = new Enum(GraphThemeMode);

export default GraphThemeMode;
