

/**
 * Find first super call in path (usually should be a `constructor`).
 * 
 * @see https://github.com/babel/babel/blob/v7.14.7/packages/babel-traverse/src/path/conversion.ts#L205
 */
export function findSuperCallPath(path) {
  let superPath;
  path.traverse({
    Function(child) {
      if (child.isArrowFunctionExpression()) return;
      child.skip();
    },

    ClassProperty(child) {
      child.skip();
    },

    CallExpression(child) {
      if (!child.get("callee").isSuper()) return;
      // we are done!
      child.stop();
      superPath = child;
    }
  });
  return superPath;
}