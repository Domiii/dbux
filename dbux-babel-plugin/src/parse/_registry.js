import { newLogger } from '@dbux/common/src/log/logger';
import AssignmentExpression from './AssignmentExpression';
import BinaryExpression from './BinaryExpression';
import CallExpression from './CallExpression';
import Function from './Function';
import LogicalExpression from './LogicalExpression';
import MemberExpression from './MemberExpression';
import ObjectExpression from './ObjectExpression';
import Program from './Program';
import UnaryExpression from './UnaryExpression';
import VariableDeclarator from './VariableDeclarator';

function init(Clazz) {
  Clazz.logger = newLogger(`parse/${Clazz.name}`);
}
init(AssignmentExpression);
init(BinaryExpression);
init(CallExpression);
init(Function);
init(LogicalExpression);
init(MemberExpression);
init(ObjectExpression);
init(Program);
init(UnaryExpression);
init(VariableDeclarator);

export {
  AssignmentExpression,
  BinaryExpression,
  CallExpression,
  Function,
  LogicalExpression,
  MemberExpression,
  ObjectExpression,
  Program,
  UnaryExpression,
  VariableDeclarator
};