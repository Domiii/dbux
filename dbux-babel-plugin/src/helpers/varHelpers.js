import EmptyObject from '../../../dbux-common/src/util/EmptyObject';

export function isInLoc(inner, outer) {

}

export function getClosestScopedPath(path) {
  if (path.node.body) {
    path = path.get('body');
  }

  let current = path;
  do {
    if (current.scope) {
      return current;
    }
    current = path.parentPath;
  }
  while (current);

  return null;
}

export function addStaticVars(path, state, ownerId, ownerType, containingLoc) {
  const scopedPath = getClosestScopedPath(path);
  const bindings = scopedPath?.scope?.bindings || EmptyObject;
  const varNames = Object.keys(bindings);

  // see: https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#bindings
  for (const varName of varNames) {
    const binding = bindings[varName];
    const {
      referencePaths,
      identifier,
      constantViolations
    } = binding;

    for (const varPath of referencePaths) {
      const { loc } = varPath;
      if (isInLoc(loc, containingLoc)) {
        // add var access
        const isWrite = !constantViolations.includes(varPath);
        state.varAccess.addVarAccess(varPath, ownerId, ownerType, identifier.name, isWrite);
      }
    }
  }
}