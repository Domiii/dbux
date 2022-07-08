import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import TraceCfg from '../../definitions/TraceCfg';
import { generateDeclaredIdentifier, ZeroNode } from './buildUtil';
import { getDeclarationTid } from '../../helpers/traceUtil';
import { buildTraceId } from './traceId';
import { convertNonComputedPropToStringLiteral } from './objects';
import { buildTraceExpressionVar } from './misc';
import { buildtraceExpressionME } from './me';

/**
 * Produces new value and return value of update expression:
 *
 * `++a` -> `l = returnValue = r + 1`
 * `a++` -> `l = (returnValue = r) + 1`
 * `a--` -> `l = (returnValue = r) - 1`
 * `++o[prop]` -> `o[prop] = returnValue = o[prop] + 1`
 * `o[prop]++` -> `o[prop] = (returnValue = o[prop]) + 1`
 * etc.
 * 
 * @param {NodePath} uePath
 */
export function buildUpdatedValue(state, uePath, lval, rval, returnValue) {
  const { ids: { aliases: { unitOfType } } } = state;
  const { operator, prefix } = uePath.node;
  const one = t.callExpression(unitOfType, [lval]);
  const op = operator[1];

  if (prefix) {
    rval = t.assignmentExpression(
      '=',
      returnValue,
      t.binaryExpression(op, rval, one)
    );
  }
  else {
    rval = t.binaryExpression(
      op,
      t.assignmentExpression('=', returnValue, rval), // (returnValue = r)
      one
    );
  }

  return t.assignmentExpression(
    '=',
    lval, // a
    rval
  );
}

/**
 * Builds the final UE:
 *
 * `++a` ->
 * `tuv(
 *    ret = twv(tev(a..., readTid), ++a, updateTid),
 *    ret,
 *    readTid,
 *    updateTid,
 *    objectTid
 * )`
 */
export function buildUpdateExpressionVar(state, traceCfg) {
  const { ids: { aliases: { traceUpdateExpressionVar } } } = state;
  let { path, data: { readTraceCfg } } = traceCfg;
  const readTid = readTraceCfg?.tidIdentifier || ZeroNode;
  const argumentNode = path.node.argument;
  const rvalNode = buildTraceExpressionVar(state, readTraceCfg);
  const returnValue = generateDeclaredIdentifier(path);
  const updateValue = buildUpdatedValue(state, path, argumentNode, rvalNode, returnValue);
  const updateTid = buildTraceId(state, traceCfg);
  const declarationTid = getDeclarationTid(traceCfg);

  return t.callExpression(traceUpdateExpressionVar, [
    updateValue, returnValue, readTid || ZeroNode, updateTid, declarationTid
  ]);
}

/**
 * [ME]
 * Builds the final UE:
 * 
 * `++o.x` ->
 * `tume(
 *    o = te(o..., objectTid),
 *    p = 'x',
 *    ret = twme(o[p] = tme(o[p]..., readTid) + 1..., updateTid),
 *    ret,
 *    readTid,
 *    updateTid,
 *    objectTid
 * )`
 * 
 * @param {TraceCfg} traceCfg 
 */
export function buildUpdateExpressionME(state, traceCfg) {
  const { ids: { aliases: { traceUpdateExpressionME } } } = state;
  let {
    path,
    data: {
      readTraceCfg
    }
  } = traceCfg;
  const {
    tidIdentifier: readTid,
    data: {
      objectTid,
      dontTraceObject,
      objectVar,
      propertyVar,
      propTid
    }
  } = readTraceCfg;
  const meNode = path.node.argument;
  const {
    object: objectNode,
    property: propertyNode,
    computed
  } = meNode;

  // build object
  const o = t.assignmentExpression('=', objectVar, objectNode);

  // build property
  let p = convertNonComputedPropToStringLiteral(propertyNode, computed);
  if (computed) {
    p = t.assignmentExpression('=',
      propertyVar,
      p
    );
  }

  const lval = t.memberExpression(objectVar, propertyVar || propertyNode, computed, false);
  const rval = buildtraceExpressionME(state, readTraceCfg);
  const returnValue = generateDeclaredIdentifier(path);
  const updateValue = buildUpdatedValue(state, path, lval, rval, returnValue);
  const updateTid = buildTraceId(state, traceCfg);

  return t.callExpression(traceUpdateExpressionME, [
    o, p, updateValue, returnValue, readTid || ZeroNode, updateTid, objectTid || ZeroNode
  ]);
}