import { pathToString } from '../helpers/pathHelpers';
import BaseId from './BaseId';
import BaseNode from './BaseNode';

/**
 * 
 */
export default class BindingIdentifier extends BaseId {
  bindingTrace;

  getTidIdentifier() {
    if (!this.bindingTrace) {
      throw new Error(`Tried to "getTidIdentifier" too early in "${this.getParent()}" - bindingTrace was not recorded yet.`);
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
    if (!scopePath.isFunction() && !scopePath.isProgram()) {
      // hackfix: just make sure, the declared variable is not hoisted to nested scope
      scopePath = scopePath.parentPath;
    }
    /**
     * @type {BaseNode}
     */
    const bindingScopeNode = this.stack.getNodeOfPath(scopePath);
    if (!bindingScopeNode?.Traces) {
      throw new Error(`BindingIdentifier's binding scope did not have a valid BaseNode: "${pathToString(scopePath)}" in "${this.getParent()}"`);
    }
    return bindingScopeNode;
  }

  /**
   * Add declaration trace to scope.
   * Hoisted by default (unless `scope` is given).
   * Will insert all declaration in one: `var {declarations.map(buildTraceDeclaration)}`
   * 
   * @param {NodePath?} definitionPath Only given if initialization occurs upon declaration.
   */
  addOwnDeclarationTrace(definitionPath = null, moreTraceData = null) {
    if (!this.getDeclarationNode()) {
      throw new Error(`Assertion failed - BindingIdentifier.getDeclarationTidIdentifier() returned nothing ` +
        `for binding "${pathToString(this.binding?.path)}" in "${this.getParent()}`);
    }

    // if (this.binding?.path.node.id !== this.path.node) {
    //   // NOTE: should never happen
    //   return;
    // }

    const bindingScopeNode = this.getDefaultBindingScopeNode();
    return bindingScopeNode.Traces.addDefaultDeclarationTrace(this, definitionPath, moreTraceData);
  }
}