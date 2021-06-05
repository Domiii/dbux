import { NodePath } from '@babel/traverse';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import { buildTraceMemberExpression } from '../instrumentation/builders/misc';
import BaseNode from './BaseNode';

/**
 * TODO
 * 
 * 1. track all read access (lval or rval), for each read o[x]:
 *    * VarRead(o): referenceId + path
 *    * VarRead(x): referenceId (if it has any) + path [if x is not constant]
 *    * VarRead(o[x]): referenceId (if it has any) + path
 * 2. track write access on final write o[x] = y
 *   * 
 */



/** @typedef {import('@babel/types/lib').Identifier} Identifier */

/**
 * NOTE: only assignments can have ME LVals
 */
function isRValME(node) {
  const { path: p } = node;
  return !(p.parentPath.isAssignment() && p.node === p.parentPath.node.id);
}

class MemberElement {
  /**
   * @type {NodePath}
   */
  path;
  /**
   * @type {boolean}
   */
  computed;

  /**
   * @type {boolean}
   */
  optional;

  constructor(path, computed, optional) {
    this.path = path;
    this.computed = computed;
    this.optional = optional;
  }
}

export default class MemberExpression extends BaseNode {
  static visitors = [
    'MemberExpression',
    'OptionalMemberExpression'
  ];
  static children = ['object', 'property'];

  /**
   * A `handler`, if assigned, takes care of this ME.
   * Disables default (rval) behavior.
   */
  handler;

  // ###########################################################################
  // ME rval handling
  // ###########################################################################

  exit() {
    if (this.handler) {
      // disable default behavior
      return;
    }

    // default behavior
    this.wrapRVal();
  }

  /**
   * @example
   * Case 1: object identifier, prop simple
   * `o.x` ->
   * `tme(te(o, tid1), 'x', tid0, [tid1])`
   *
   * Case 2: object identifier, prop computed
   * `o[f(x)]` ->
   * `tme(te(o, tid1), te(f(...(x)), tid2), tid0, [tid1, tid2])`
   *
   * Case 3: prop computed
   * `g().[f(x)]` ->
   * `tme(te(g(), tid1), te(f(...(x)), tid2), tid0, [tid1, tid2])`
   */
  wrapRVal() {
    // TODO: `import.meta` (rval only)
    // TODO: `super.f()`, `super.x = 3` etc.

    const { path } = this;

    const [objectPath, propertyPath] = this.getChildPaths();
    // const [objectNode, propertyNode] = this.getChildNodes();
    const {
      computed,
      optional
    } = path.node;

    const traceData = {
      path,
      node: this,
      staticTraceData: {
        type: TraceType.ME
      },
      meta: {
        traceCall: optional ? 'traceMemberExpressionOptional' : 'traceMemberExpression',
        build: buildTraceMemberExpression
      }
    };
    const inputs = [objectPath];
    if (computed /* && !propertyPath.isConstantExpression() */) {
      // future-work: only trace property, if it is not a constant
      inputs.push(propertyPath);
    }
    this.Traces.addTraceWithInputs(traceData, inputs);
  }
}
