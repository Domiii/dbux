import { newLogger } from '@dbux/common/src/log/logger';
import ArrayExpression from './ArrayExpression';
import ArrowFunctionExpression from './ArrowFunctionExpression';
import AssignmentExpression from './AssignmentExpression';
import AwaitExpression from './AwaitExpression';
import BinaryExpression from './BinaryExpression';
import BindingIdentifier from './BindingIdentifier';
import Block from './Block';
import CallExpression from './CallExpression';
import ClassDeclaration from './ClassDeclaration';
import ClassExpression from './ClassExpression';
import ForInStatement from './ForInStatement';
import ForOfStatement from './ForOfStatement';
import ForStatement from './ForStatement';
import FunctionDeclaration from './FunctionDeclaration';
import FunctionExpression from './FunctionExpression';
import Literal from './Literal';
import LogicalExpression from './LogicalExpression';
import MemberExpression from './MemberExpression';
import ObjectExpression from './ObjectExpression';
import ObjectMethod from './ObjectMethod';
import ObjectProperty from './ObjectProperty';
import Program from './Program';
import ReferencedIdentifier from './ReferencedIdentifier';
import ReturnStatement from './ReturnStatement';
import SequenceExpression from './SequenceExpression';
import SpreadElement from './SpreadElement';
import UnaryExpression from './UnaryExpression';
import VariableDeclarator from './VariableDeclarator';
import WhileStatement from './WhileStatement';

function init(Clazz) {
  Clazz.logger = newLogger(`parse/${Clazz.name}`);
}
init(ArrayExpression);
init(ArrowFunctionExpression);
init(AssignmentExpression);
init(AwaitExpression);
init(BinaryExpression);
init(BindingIdentifier);
init(Block);
init(CallExpression);
init(ClassDeclaration);
init(ClassExpression);
init(ForInStatement);
init(ForOfStatement);
init(ForStatement);
init(FunctionDeclaration);
init(FunctionExpression);
init(Literal);
init(LogicalExpression);
init(MemberExpression);
init(ObjectExpression);
init(ObjectMethod);
init(ObjectProperty);
init(Program);
init(ReferencedIdentifier);
init(ReturnStatement);
init(SequenceExpression);
init(SpreadElement);
init(UnaryExpression);
init(VariableDeclarator);
init(WhileStatement);

export {
  ArrayExpression,
  ArrowFunctionExpression,
  AssignmentExpression,
  AwaitExpression,
  BinaryExpression,
  BindingIdentifier,
  Block,
  CallExpression,
  ClassDeclaration,
  ClassExpression,
  ForInStatement,
  ForOfStatement,
  ForStatement,
  FunctionDeclaration,
  FunctionExpression,
  Literal,
  LogicalExpression,
  MemberExpression,
  ObjectExpression,
  ObjectMethod,
  ObjectProperty,
  Program,
  ReferencedIdentifier,
  ReturnStatement,
  SequenceExpression,
  SpreadElement,
  UnaryExpression,
  VariableDeclarator,
  WhileStatement
};