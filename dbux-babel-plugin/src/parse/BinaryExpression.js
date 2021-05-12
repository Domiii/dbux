import TraceType from '@dbux/common/src/core/constants/TraceType';
import { getPresentableString } from '../helpers/pathHelpers';
import BaseArithmeticExpression from './BaseArithmeticExpression';

export default class BinaryExpression extends BaseArithmeticExpression {
  static nodes = ['left', 'right'];
}