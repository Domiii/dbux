import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { generateDeclaredIdentifier } from './buildUtil';

/**
 * Converts:
 * `++a` -> `a = a + 1`
 * `a++` -> `(a = (_a = a) + 1, _a)`
 * `a--` -> `(a = (_a = a) - 1, _a)`
 * etc.
 * 
 * @param {NodePath} uePath
 */
export function convertUE(uePath, lval, rval) {
  const { operator, prefix } = uePath.node;
  const one = t.numericLiteral(1);
  const op = operator[1];

  if (prefix) {
    return t.assignmentExpression('=', lval,
      t.binaryExpression(op, rval, one)
    );
  }
  else {
    const tmp = generateDeclaredIdentifier(uePath);
    return t.sequenceExpression([
      t.assignmentExpression(
        '=',
        lval, // a
        t.binaryExpression(
          op,
          t.assignmentExpression('=', tmp, rval), // (_a = a)
          one
        )
      ),
      tmp
    ]);
  }
}

export function buildUpdateExpressionME(state, traceCfg) {
  const { path: uePath } = traceCfg;
  const lval = TODO;
  const rval = TODO;
  const newUE = convertUE(uePath, lval, rval);

  return t.callExpression(twME, [o, p, newUE, readTid, writeTid, objectTid]);
}

export function buildUpdateVar(state, traceCfg) {
  const { path: uePath } = traceCfg;
  const lval = TODO;
  const rval = TODO;
  const newUE = convertUE(uePath, lval, rval);
}