import merge from 'lodash/merge';
import { isDeclarationTrace } from '@dbux/common/src/types/constants/TraceType';
import { astNodeToString, pathToString } from '../helpers/pathHelpers';
import { ZeroNode } from '../instrumentation/builders/buildUtil';
import BaseId from './BaseId';
import BaseNode from './BaseNode';

export function makeDeclarationVarStaticTraceData(idPath) {
  const staticTraceData = {};
  staticTraceData.data = {};
  staticTraceData.dataNode = {};
  staticTraceData.dataNode.label = staticTraceData.data.name = idPath.toString();

  // console.debug(`[DECL] ${JSON.stringify(moreTraceData.staticTraceData)}`);

  return staticTraceData;
}

/**
 * 
 */
export default class BindingIdentifier extends BaseId {
  bindingTrace;

  getTidIdentifier() {
    if (!this.bindingTrace) {
      // NOTE: this can mean its a global (or just plain undeclared)
      // eslint-disable-next-line max-len
      // this.logger.error(new Error(`Tried to "getTidIdentifier" too early for "${this}" in "${this.getParentString()}" - BindingIdentifier.bindingTrace was not recorded yet. getDeclarationNode() = "${this.getDeclarationNode()}" in "${this.getDeclarationNode().getParentString()}"`));
      return ZeroNode;
    }
    return this.bindingTrace.tidIdentifier;
  }

  // getOwnDeclarationNode() {
  //   return this;
  // }

  getBindingScope() {
    let { /* path, */ scope } = this.binding;

    // if (!scopePath.isFunction() && !scopePath.isProgram()) {
    //   // hackfix: just make sure, the declared variable is not hoisted to nested scope
    //   // wont-work: some bindings (such as class static/instance prop/method bindings) don't work like this
    //   scopePath = scopePath.parentPath;
    // }

    // /**
    //  * Based on `@babel/traverse/lib/scope/index.js` -> `collectorVisitor`
    //  */
    // if (path.isBlockScoped()) {
    //   let { scope } = path;
    //   if (scope.path === path) scope = scope.parent;
    //   return scope.getBlockParent();
    // }
    // else if (path.isDeclaration() || path.isFunction()) {
    //   // if (path.isBlockScoped()) return;
    //   // if (path.isExportDeclaration()) return;
    //   // const parent = path.scope.getFunctionParent() || path.scope.getProgramParent();
    //   // parent.registerDeclaration(path);
    //   return path.scope.getFunctionParent() || path.scope.getProgramParent();
    // }

    // TODO: Class/FunctionExpressions vs. t.NOT_LOCAL_BINDING?

    // TODO: catch
    // CatchClause(path) {
    //   path.scope.registerBinding("let", path);
    // }
    // return path.scope;
    return scope;
  }

  getBindingScopeNode(scope) {
    // const scopePath = this.binding.path.scope.path;
    scope = scope || this.getBindingScope();
    let scopePath = scope.path;

    /**
     * @type {BaseNode}
     */
    const bindingScopeNode = this.getNodeOfPath(scopePath);

    // console.warn(`getDefaultBindingScopeNode(), [${this.path.parentPath.node.type}] ${this.path.toString()}, scope=${scopePath.node.type}`);

    if (!bindingScopeNode?.Traces) {
      throw new Error(`BindingIdentifier's binding scope did not have a valid BaseNode: "${pathToString(scopePath)}" in "${this.getParentString()}"`);
    }
    return bindingScopeNode;
  }

  buildDefaultTrace() {
    if (this.path.isReferencedIdentifier()) {
      /**
       * hackfix for `!` unary operator
       * @see https://github.com/Domiii/dbux/issues/602
       */
      return this.buildDefaultTraceBase();
    }
    return super.buildDefaultTrace();
  }

  /**
   * Add declaration trace to scope.
   * Hoisted by default if node is Declaration (unless `moreTraceData.meta.hoisted` set to false).
   * 
   * Will unshift all `hoisted` declarations as:
   *   `var {declarations.map(traceDeclaration(stid, value))}`
   * Not `hoisted` declarations as:
   *    `te(value, tid)`
   * 
   * @param {NodePath?} definitionPathOrNode Initialization occurs upon declaration. Only used if `hoisted`. Will be set to `targetPath`.
   */
  addOwnDeclarationTrace(definitionPathOrNode = null, moreTraceData = null) {
    // if (this.binding?.path.node.id !== this.path.node) {
    //   // NOTE: should never happen
    //   return;
    // }

    const traceType = moreTraceData?.staticTraceData?.type;
    if (traceType && !isDeclarationTrace(traceType)) {
      this.warn(`staticTraceData.type is not declaration type. You might want to use "addTrace" instead of "addOwnDeclarationTrace" in this case.`);
    }

    // NOTE: do not try to add to scope that is not `BindingScope`.
    //      -> will fail in some cases, such as `FunctionExpression` (which needs to add variable to own body).
    const bindingScopeNode = this.getBindingScopeNode(/* moreTraceData?.scope */);

    if (!moreTraceData) {
      moreTraceData = {};
    }
    moreTraceData.staticTraceData = merge(moreTraceData.staticTraceData, makeDeclarationVarStaticTraceData(this.path));

    if (!moreTraceData?.scope) {
      moreTraceData.scope = bindingScopeNode.path.scope;
    }

    // this.warn(`addOwnDeclarationTrace(), [${this.path.parentPath.node.type}] ${this.path.toString()} @ ${bindingScopeNode}`);

    return bindingScopeNode.Traces.addDefaultDeclarationTrace(this, definitionPathOrNode, moreTraceData);
  }
}
