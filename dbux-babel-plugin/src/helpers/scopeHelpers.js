import { NodePath } from '@babel/traverse';


/**
 * @param {NodePath} scopePath 
 * 
 * WARNING: might convert the path (`ensureBlock`). Thus must run during instrumentation, and not before.
 * 
 * Based on `Scope.push`.
 * @see `@babel/traverse/lib/scope/index.js`
 * @return {NodePath}
 */
export function getScopeBlockPathInstrument(path) {
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