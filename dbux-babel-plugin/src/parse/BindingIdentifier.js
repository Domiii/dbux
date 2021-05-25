// import { Binding } from '@babel/traverse';
import * as t from '@babel/types';
// import TraceType from '@dbux/common/src/core/constants/TraceType';
import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import { getPresentableString } from '../helpers/pathHelpers';
import BaseId from './BaseId';

/**
 * NOTE: The `bindingPath` (and thus `bindingNode`) is usually the parent of the `BindingIdentifier`
 */
export default class BindingIdentifier extends BaseId {
  bindingTrace;

  getTidIdentifier() {
    if (!this.bindingTrace) {
      throw new Error(`Tried to "getTidIdentifier" too early in ${this} - bindingTrace was not created yet.`);
    }
    return this.bindingTrace.tidIdentifier;
  }


  // ###########################################################################
  // exit1
  // ###########################################################################

  /**
   * Based on `@babel/traverse/lib/scope/index.js` -> `collectVisitor`
   */
  _getScope() {
    const { path } = this.binding;
    if (path.isBlockScoped()) {
      let { scope } = path;
      if (scope.path === path) scope = scope.parent;
      return scope.getBlockParent();
    }
    else if (path.isDeclaration()) {
      // if (path.isBlockScoped()) return;
      // if (path.isExportDeclaration()) return;
      // const parent = path.scope.getFunctionParent() || path.scope.getProgramParent();
      // parent.registerDeclaration(path);
      return path.scope.getFunctionParent() || path.scope.getProgramParent();
    }

    // TODO: Class/FunctionExpressions vs. t.NOT_LOCAL_BINDING?

    // TODO: catch
    // CatchClause(path) {
    //   path.scope.registerBinding("let", path);
    // }
    return path.scope;
  }

  exit1() {
    // const scopePath = this.binding.path.scope.path;
    const scopePath = this._getScope().path;
    const bindingScopeNode = this.stack.getNodeOfPath(scopePath);
    if (!bindingScopeNode || !bindingScopeNode.Traces) {
      throw new Error(`BindingIdentifier's scope did not have a scope: ${getPresentableString(scopePath)}`);
    }

    this.bindingTrace = bindingScopeNode.Traces.addDeclarationTrace(this);
  }
}