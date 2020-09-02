import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let DialogNodeKind = {
  None: 0,
  Message: 1,
  Modal: 2
};

DialogNodeKind = new Enum(DialogNodeKind);

export default DialogNodeKind;