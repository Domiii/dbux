import SpecialIdentifierType from '@dbux/common/src/types/constants/SpecialIdentifierType';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import { ZeroNode } from '../instrumentation/builders/buildUtil';
import { buildtraceExpressionME } from '../instrumentation/builders/me';
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
  _handler;

  set handler(handler) {
    this._handler = handler;
  }

  /**
   * Set `handler` recursively
   */
  set handlerDeep(handler) {
    this._handler = handler;
    const [objectNode] = this.getChildNodes();
    if (objectNode instanceof MemberExpression) {
      objectNode.handlerDeep = handler;
    }
  }

  buildDefaultTrace() {
    // No need for a default trace.
    // NOTE: MEs are traced differently depending on whether they are rvals or lvals
    //      but they are always taken care of.
    return null;
  }

  /** ###########################################################################
   * Special MEs: util
   * ##########################################################################*/

  meMatchesIds(objectName, propName) {
    const [objectNode] = this.getChildNodes();
    const [objectPath, propertyPath] = this.getChildPaths();

    if (!objectPath || !propertyPath) {
      return false;
    }

    // NOTE: must be global
    if (/* !objectPath.node.computed && !propertyPath.node.computed &&  */
      objectNode.isGlobal && objectPath.node.name === objectName && propertyPath.node.name === propName) {
      return true;
    }

    return false;
  }

  hasSpecialTypeObject(specialIdentifierType) {
    const [objectNode] = this.getChildNodes();
    return objectNode.specialType === specialIdentifierType;
  }
  
  /** ########################################
   * Special MEs: specific
   * #######################################*/

  isProcessEnv() {
    return this.meMatchesIds('process', 'env');
  }

  /**
   * I.e. `module.exports`.
   */
  isModuleExports() {
    return this.meMatchesIds('module', 'exports');
  }

  /**
   * I.e. `module.X`.
   */
  hasObjectModule() {
    return this.hasSpecialTypeObject(SpecialIdentifierType.Module);
  }

  /**
   * I.e. `exports.X`.
   */
  hasObjectExports() {
    return this.hasSpecialTypeObject(SpecialIdentifierType.Exports);
  }

  /**
   * I.e. `module.exports.X`.
   */
  containsModuleExports() {
    const [objectNode] = this.getChildNodes();
    return objectNode instanceof MemberExpression && (
      objectNode.isModuleExports()
    );
  }

  /** ########################################
   * Special MEs: recursive
   * #######################################*/

  isProcessEnvChain() {
    if (this.isProcessEnv()) {
      return true;
    }
    const [objectNode] = this.getChildNodes();
    return objectNode instanceof MemberExpression && (
      objectNode.isProcessEnvChain()
    );
  }

  /** ########################################
   * Special MEs: ignore rules
   * #######################################*/

  /**
   * Certain rval MEs should not be traced.
   * E.g.: `process.env`, `process.env.X`, `process.env.X.Y`, `module.exports.X`.
   * 
   * NOTE: `module.exports` of `module.exports.X = ...` is treated as rval when the whole thing is not treated as lval.
   */
  shouldIgnoreThisRVal() {
    return this.isProcessEnvChain() ||
      this.isModuleExports();
  }

  /**
   * Certain lval MEs should not be traced.
   * E.g.: `exports.X`, `module.exports`.
   */
  shouldIgnoreThisLVal() {
    return this.hasObjectExports() || this.isModuleExports() || this.containsModuleExports();
  }

  /** ###########################################################################
   * Common (l + r)val stuff
   * ##########################################################################*/

  makeMETraceData(objectAstNode = null) {
    const { path, Traces } = this;

    const [objectNode, propertyNode] = this.getChildNodes();
    const {
      computed
    } = path.node;

    // prepare object
    const objectTraceCfg = objectNode.addDefaultTrace();
    let objectTid = objectTraceCfg?.tidIdentifier;
    if (!objectTid) {
      this.warn(`objectNode did not have traceCfg.tidIdentifier in ${objectNode}`);
      objectTid = ZeroNode;
    }
    objectAstNode = objectAstNode || Traces.generateDeclaredUidIdentifier('o');

    // prepare property
    let propertyAstNode;
    if (computed) {
      propertyNode.addDefaultTrace();
      propertyAstNode = Traces.generateDeclaredUidIdentifier('p');
    }

    return {
      objectTid,
      objectAstNode,
      propertyAstNode
    };
  }

  // ###########################################################################
  // ME rval handling
  // ###########################################################################

  exit() {
    if (this._handler) {
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
    if (this.shouldIgnoreThisRVal()) {
      // this.debug(`[addRValTrace IGNORE] ${this.debugTag}`);
      return null;
    }

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
    // TODO: `import.meta` (rval only)//*-

    const { path } = this;
    // const [objectPath] = this.getChildPaths();

    if (targetPath === undefined) {
      targetPath = path;
    }

    const {
      optional
    } = path.node;

    const data = this.makeMETraceData(objectAstNode);
    /**
     * Whether caller already took care of tracing object.
     * If not, builder needs to trace object explicitely.
     */
    data.isObjectTracedAlready = !!objectAstNode;
    // NOTE: at build time, the original ME node might have already been replaced
    data.optional = optional;

    const traceData = {
      path,
      node: this,
      staticTraceData: {
        type: TraceType.ME
      },
      data,
      meta: {
        traceCall: 'traceExpressionME',
        build: buildtraceExpressionME,
        targetPath
      }
    };

    return this.Traces.addTrace(traceData);
  }
}
