import { isDeclarationTrace } from '@dbux/common/src/core/constants/TraceType';
import { pathToString } from '../helpers/pathHelpers';
import { ZeroNode } from '../instrumentation/builders/buildUtil';
import BaseId from './BaseId';
import BaseNode from './BaseNode';

/**
 * 
 */
export default class BindingIdentifier extends BaseId {
  bindingTrace;

  getTidIdentifier() {
    if (!this.bindingTrace) {
      // eslint-disable-next-line max-len
      this.logger.error(new Error(`Tried to "getTidIdentifier" too early for "${this}" in "${this.getParentString()}" - BindingIdentifier.bindingTrace was not recorded yet. getDeclarationNode() = "${this.getDeclarationNode()}" in "${this.getDeclarationNode().getParentString()}"`));
      return ZeroNode;
    }
    return this.bindingTrace.tidIdentifier;
  }


  // ###########################################################################
  // exit1
  // ###########################################################################

  getBindingScope() {
    const { path, scope } = this.binding;


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

  getDefaultBindingScopeNode() {
    // const scopePath = this.binding.path.scope.path;
    let scopePath = this.getBindingScope().path;
    // if (!scopePath.isFunction() && !scopePath.isProgram()) {
    //   // hackfix: just make sure, the declared variable is not hoisted to nested scope
    //   scopePath = scopePath.parentPath;
    // }
    
    /**
     * @type {BaseNode}
     */
    const bindingScopeNode = this.getNodeOfPath(scopePath);
    if (!bindingScopeNode?.Traces) {
      throw new Error(`BindingIdentifier's binding scope did not have a valid BaseNode: "${pathToString(scopePath)}" in "${this.getParentString()}"`);
    }
    return bindingScopeNode;
  }

  /**
   * Add declaration trace to scope.
   * Hoisted by default (unless `hoisted` set to false).
   * 
   * Will unshift all `hoisted` declarations as:
   *   `var {declarations.map(traceDeclaration(stid, value))}`
   * Not `hoisted` declarations as:
   *    `te(value, tid)`
   * 
   * @param {NodePath?} definitionPathOrNode Initialization occurs upon declaration. Only used if `hoisted`.
   */
  addOwnDeclarationTrace(definitionPathOrNode = null, moreTraceData = null) {
    // if (this.binding?.path.node.id !== this.path.node) {
    //   // NOTE: should never happen
    //   return;
    // }

    const traceType = moreTraceData?.staticTraceData?.type;
    if (traceType && !isDeclarationTrace(traceType)) {
      this.warn(`staticTraceData.type is not declaration type. You might prefer "addTrace" over "addOwnDeclarationTrace" in this case.`);
    }

    const bindingScopeNode = this.getDefaultBindingScopeNode();
    const declarationNode = this.getDeclarationNode();
    if (declarationNode !== this) {
      // TODO: if `definitionPath`, convert to `write` trace?
    }
    return bindingScopeNode.Traces.addDefaultDeclarationTrace(this, definitionPathOrNode, moreTraceData);
  }
}