import Enum from 'dbux-common/src/util/Enum';

let MessageType = {
  InitComponent: 1,
  Request: 2,
  Reply: 3,
  Ping: 4
};

MessageType = new Enum(MessageType);

export default MessageType;