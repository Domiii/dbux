import { NodePath } from '@babel/traverse';


/**
 * @param {NodePath} path 
 * 
 * Based on `Scope.push`.
 * @see `@babel/traverse/lib/scope/index.js`
 * @return {NodePath}
 */
export function getScopeBlockPath(path) {
  path = path.scope.path;

  if (!path.isBlockStatement() && !path.isProgram()) {
    path = this.getBlockParent().path;
  }

  if (path.isSwitchStatement()) {
    path = (this.getFunctionParent() || this.getProgramParent()).path;
  }

  if (path.isLoop() || path.isCatchClause() || path.isFunction()) {
    path.ensureBlock();
    path = path.get("body");
  }
  return path;
}