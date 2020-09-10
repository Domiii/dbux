import NoneNode from './NoneNode';
import MessageNode from './MessageNode';
import ModalNode from './ModalNode';
import DialogNodeKind from '../DialogNodeKind';

export default {
  [DialogNodeKind.None]: NoneNode,
  [DialogNodeKind.Message]: MessageNode,
  [DialogNodeKind.Modal]: ModalNode
};