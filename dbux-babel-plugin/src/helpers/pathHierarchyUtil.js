/** @typedef { import("@babel/types").Node } AstNode */
/** @typedef { import("@babel/traverse").NodePath } NodePath */

/**
 * @param {NodePath} path
 * @param {(p: NodePath) => boolean} cb
 */
export function findClosestPath(path, cb, sameScope = false) {
  const origScope = path.scope;
  do {
    if (cb(path)) {
      return path;
    }
    if (sameScope && path.scope !== origScope) {
      break;
    }
    path = path.parentPath;
  } while (path);

  return null;
}


/**
 * @param {NodePath} path
 */
export function getClosestAssignmentOrDeclaration(path) {
  const sameScope = true;
  return findClosestPath(
    path,
    (p) => p.isAssignmentExpression() || p.isVariableDeclaration(),
    sameScope
  );
}

/**
 * 
 * 
 * @param {NodePath} path
 * 
 * @see https://babeljs.io/docs/en/babel-types#patternlike
 */
export function getPatternRootPath(path) {
  const sameScope = true;
  return findClosestPath(
    path,
    /**
     * @see https://babeljs.io/docs/en/babel-types#patternlike
     */
    (p) => p.isPatternLike(),
    sameScope
  );
}


/**
 * BlockParents define the scope of let and const declarations.
 * This function returns the child inside the `BlockParent`.
 * 
 * @param {NodePath} path
 * 
 * @see https://babeljs.io/docs/en/babel-types#blockparent
 */
export function getClosestBlockParentChild(path) {
  return findClosestPath(
    path,
    (p) => p.parentPath.isBlockParent()
  );
}


/**
 * @param {NodePath} path
 */
export function isPathInScopeBody(path) {
  const blockParentChild = getClosestBlockParentChild(path);
  return blockParentChild && blockParentChild.listKey === 'body';
}

/**
 * Returns path of param, if path is in param, or null otherwise.
 * 
 * @param {NodePath} path
 */
export function getClosestParamPath(path) {
  /**
   * NOTE: listKey is very much undocumented.
   * Here is an example:
   * @see https://github.com/babel/babel/issues/12570
   */
  return findClosestPath(path, (p) => p.listKey === 'params');
}
