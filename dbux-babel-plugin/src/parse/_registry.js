import { newLogger } from '@dbux/common/src/log/logger';
import ArrowFunctionExpression from './ArrowFunctionExpression';
import AssignmentExpression from './AssignmentExpression';
import AwaitExpression from './AwaitExpression';
import BinaryExpression from './BinaryExpression';
import BindingIdentifier from './BindingIdentifier';
import Block from './Block';
import CallExpression from './CallExpression';
import FunctionDeclaration from './FunctionDeclaration';
import FunctionExpression from './FunctionExpression';
import LogicalExpression from './LogicalExpression';
import MemberExpression from './MemberExpression';
import Method from './Method';
import ObjectExpression from './ObjectExpression';
import Program from './Program';
import ReferencedIdentifier from './ReferencedIdentifier';
import ReturnStatement from './ReturnStatement';
import SequenceExpression from './SequenceExpression';
import UnaryExpression from './UnaryExpression';
import VariableDeclarator from './VariableDeclarator';

function init(Clazz) {
  Clazz.logger = newLogger(`parse/${Clazz.name}`);
}
init(ArrowFunctionExpression);
init(AssignmentExpression);
init(AwaitExpression);
init(BinaryExpression);
init(BindingIdentifier);
init(Block);
init(CallExpression);
init(FunctionDeclaration);
init(FunctionExpression);
init(LogicalExpression);
init(MemberExpression);
init(Method);
init(ObjectExpression);
init(Program);
init(ReferencedIdentifier);
init(ReturnStatement);
init(SequenceExpression);
init(UnaryExpression);
init(VariableDeclarator);

export {
  ArrowFunctionExpression,
  AssignmentExpression,
  AwaitExpression,
  BinaryExpression,
  BindingIdentifier,
  Block,
  CallExpression,
  FunctionDeclaration,
  FunctionExpression,
  LogicalExpression,
  MemberExpression,
  Method,
  ObjectExpression,
  Program,
  ReferencedIdentifier,
  ReturnStatement,
  SequenceExpression,
  UnaryExpression,
  VariableDeclarator
};