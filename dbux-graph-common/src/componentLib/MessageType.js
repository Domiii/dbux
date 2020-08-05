import Enum from '@dbux/common/src/util/Enum';

// eslint-disable-next-line import/no-mutable-exports
let MessageType = {
  InitComponent: 1,
  Request: 2,
  Reply: 3,
  Ping: 4
};

MessageType = new Enum(MessageType);

export default MessageType;