import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import TraceCfg from '../../definitions/TraceCfg';
import { generateDeclaredIdentifier, getDeclarationTid, ZeroNode } from './buildUtil';
import { buildTraceId } from './traceId';
import { convertNonComputedPropToStringLiteral } from './objects';

/**
 * Produces new value and return value of update expression:
 *
 * `++a` -> `a = returnValue = a + 1`
 * `a++` -> `a = (returnValue = a) + 1`
 * `a--` -> `a = (returnValue = a) - 1`
 * `++o[prop]` -> `o[prop] = returnValue = o[prop] + 1`
 * `o[prop]++` -> `o[prop] = (returnValue = o[prop]) + 1`
 * etc.
 * 
 * @param {NodePath} uePath
 */
export function buildUpdatedValue(uePath, lval, returnValue) {
  const { operator, prefix } = uePath.node;
  const one = t.numericLiteral(1);
  const op = operator[1];

  let rval;
  if (prefix) {
    rval = t.assignmentExpression(
      '=',
      returnValue,
      t.binaryExpression(op, lval, one)
    );
  }
  else {
    rval = t.binaryExpression(
      op,
      t.assignmentExpression('=', returnValue, lval), // (returnValue = a)
      one
    );
  }

  return t.assignmentExpression(
    '=',
    lval, // a
    rval
  );
}

export function buildUpdateVar(state, traceCfg) {
  const { ids: { aliases: { traceUpdateExpressionVar } } } = state;
  let { path, data: { readTid } } = traceCfg;
  readTid = readTid || ZeroNode;
  const argumentNode = path.node;
  const returnValue = generateDeclaredIdentifier(path);
  const updateValue = buildUpdatedValue(path, argumentNode, returnValue);
  const updateTid = buildTraceId(state, traceCfg);
  const declarationTid = getDeclarationTid(traceCfg);

  return t.callExpression(traceUpdateExpressionVar, [updateValue, returnValue, readTid, updateTid, declarationTid]);
}

/**
 * @param {TraceCfg} traceCfg 
 * @returns 
 */
export function buildUpdateExpressionME(state, traceCfg) {
  const { ids: { aliases: { traceUpdateExpressionME } } } = state;
  let { path, data: { readTid } } = traceCfg;
  readTid = readTid || ZeroNode;
  const meNode = path.node;
  const { object: objectNode, property: propertyNode } = meNode;
  const oVar = path.scope.generateDeclaredUidIdentifier('o');
  const propVar = path.scope.generateDeclaredUidIdentifier('p');
  const o = t.assignmentExpression('=', oVar, objectNode);
  const p = t.assignmentExpression('=', propVar, convertNonComputedPropToStringLiteral(propertyNode, meNode.computed));
  const returnValue = generateDeclaredIdentifier(path);
  const updateValue = buildUpdatedValue(path, meNode, returnValue);
  const updateTid = buildTraceId(state, traceCfg);
  
  return t.callExpression(traceUpdateExpressionME, [o, p, updateValue, returnValue, readTid, updateTid, objectTid]);
}