import { NodePath } from '@babel/traverse';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import { buildtraceExpressionME } from '../instrumentation/builders/misc';
import BaseNode from './BaseNode';



/** @typedef {import('@babel/types/lib').Identifier} Identifier */

/**
 * NOTE: only assignments can have ME LVals
 */
function isRValME(node) {
  const { path: p } = node;
  return !(p.parentPath.isAssignment() && p.node === p.parentPath.node.id);
}

// class MemberElement {
//   /**
//    * @type {NodePath}
//    */
//   path;
//   /**
//    * @type {boolean}
//    */
//   computed;

//   /**
//    * @type {boolean}
//    */
//   optional;

//   constructor(path, computed, optional) {
//     this.path = path;
//     this.computed = computed;
//     this.optional = optional;
//   }
// }

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

  buildDefaultTrace() {
    // No need for a default trace.
    // NOTE: MEs are traced depending on whether they are rvals or lvals
    //      but they are always taken care of.
    return null;
  }

  // ###########################################################################
  // ME rval handling
  // ###########################################################################

  exit() {
    if (this.handler) {
      // disable default behavior
      return;
    }

    // default behavior
    this.addRValTrace();
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
  addRValTrace(targetPath, objectAstNode) {
    /**
     * TODO: `super` (e.g. `super.f()`, `super.x = 3` etc.)
     * @example
     * class A { x = 3; }
     * class B extends A { 
     *   f() { 
     *     console.log(Object.getPrototypeOf(this.constructor.prototype).constructor.name, super.constructor.name);
     *   }
     * }
     * console.log(new B().f(), super.constructor.name);  // 'A A'
     * 
     */
    // TODO: `import.meta` (rval only)

    const { path } = this;
    // const [objectPath] = this.getChildPaths();

    if (targetPath === undefined) {
      targetPath = path;
    }

    const [objectNode, propertyNode] = this.getChildNodes();
    const {
      computed,
      optional
    } = path.node;

    const objectTraceCfg = objectNode.addDefaultTrace();
    const objectTid = objectTraceCfg?.tidIdentifier;
    if (computed /* && !propertyPath.isConstantExpression() */) {
      // inputs.push(propertyPath);
      propertyNode.addDefaultTrace();
    }

    const traceData = {
      path,
      node: this,
      staticTraceData: {
        type: TraceType.ME
      },
      meta: {
        traceCall: optional ? 'traceExpressionMEOptional' : 'traceExpressionME',
        build: buildtraceExpressionME,
        targetPath
      },
      data: {
        objectTid,
        // remember `objectAstNode`, if given
        objectAstNode
      }
    };

    return this.Traces.addTrace(traceData);
  }
}
