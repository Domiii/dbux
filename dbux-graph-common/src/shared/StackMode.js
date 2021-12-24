import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let StackModeConfig = {
  Hidden: 1,
  Visible: 2,
  FullScreen: 3,
};

/**
 * @type {(Enum|typeof StackModeConfig)}
 */
const StackMode = new Enum(StackModeConfig);

export default StackMode;

const DisplayNameByType = {
  [StackMode.Hidden]: 'stack',
  [StackMode.Visible]: 'stack',
  [StackMode.FullScreen]: 'Stack',
};

export function getStackModeDisplayName(type) {
  return DisplayNameByType[type];
}