import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let ThemeMode = {
  Light: 1,
  Dark: 2
};

ThemeMode = new Enum(ThemeMode);

export default ThemeMode;
