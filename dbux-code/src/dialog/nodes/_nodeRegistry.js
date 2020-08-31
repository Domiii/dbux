import MessageNode from './MessageNode';
import ModalNode from './ModalNode';
import DialogNodeKind from '../DialogNodeKind';

export default {
  [DialogNodeKind.Message]: MessageNode,
  [DialogNodeKind.Modal]: ModalNode
};