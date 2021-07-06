import { NodePath } from '@babel/traverse';


/**
 * @param {NodePath} scopePath 
 * 
 * Based on `Scope.push`.
 * @see `@babel/traverse/lib/scope/index.js`
 * @return {NodePath}
 */
export function getScopeBlockPath(path) {
  const { scope } = path;
  let scopePath = scope.path;

  if (!scopePath.isBlockStatement() && !scopePath.isProgram()) {
    scopePath = scope.getBlockParent().path;
  }

  if (scopePath.isSwitchStatement()) {
    scopePath = (scope.getFunctionParent() || scope.getProgramParent()).path;
  }

  if (scopePath.isLoop() || scopePath.isCatchClause() || scopePath.isFunction()) {
    scopePath.ensureBlock();
    scopePath = scopePath.get("body");
  }
  return scopePath;
}