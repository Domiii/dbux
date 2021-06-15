import { newLogger } from '@dbux/common/src/log/logger';
import ArrayExpression from './ArrayExpression';
import ArrowFunctionExpression from './ArrowFunctionExpression';
import AssignmentExpression from './AssignmentExpression';
import AwaitExpression from './AwaitExpression';
import BinaryExpression from './BinaryExpression';
import BindingIdentifier from './BindingIdentifier';
import Block from './Block';
import CallExpression from './CallExpression';
import CatchClause from './CatchClause';
import ClassDeclaration from './ClassDeclaration';
import ClassExpression from './ClassExpression';
import ConditionalExpression from './ConditionalExpression';
import DoWhileStatement from './DoWhileStatement';
import ForInStatement from './ForInStatement';
import ForOfStatement from './ForOfStatement';
import ForStatement from './ForStatement';
import FunctionDeclaration from './FunctionDeclaration';
import FunctionExpression from './FunctionExpression';
import IfStatement from './IfStatement';
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
import SwitchCase from './SwitchCase';
import SwitchStatement from './SwitchStatement';
import TemplateLiteral from './TemplateLiteral';
import ThrowStatement from './ThrowStatement';
import UnaryExpression from './UnaryExpression';
import UpdateExpression from './UpdateExpression';
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
init(CatchClause);
init(ClassDeclaration);
init(ClassExpression);
init(ConditionalExpression);
init(DoWhileStatement);
init(ForInStatement);
init(ForOfStatement);
init(ForStatement);
init(FunctionDeclaration);
init(FunctionExpression);
init(IfStatement);
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
init(SwitchCase);
init(SwitchStatement);
init(TemplateLiteral);
init(ThrowStatement);
init(UnaryExpression);
init(UpdateExpression);
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
  CatchClause,
  ClassDeclaration,
  ClassExpression,
  ConditionalExpression,
  DoWhileStatement,
  ForInStatement,
  ForOfStatement,
  ForStatement,
  FunctionDeclaration,
  FunctionExpression,
  IfStatement,
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
  SwitchCase,
  SwitchStatement,
  TemplateLiteral,
  ThrowStatement,
  UnaryExpression,
  UpdateExpression,
  VariableDeclarator,
  WhileStatement
};