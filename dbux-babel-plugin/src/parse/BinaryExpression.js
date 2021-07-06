// import TraceType from '@dbux/common/src/core/constants/TraceType';
// import { pathToString } from '../helpers/pathHelpers';
import BaseNode from './BaseNode';

export default class BinaryExpression extends BaseNode {
  static children = ['left', 'right'];
  static plugins = [
    'ArithmeticExpression'
  ];
}