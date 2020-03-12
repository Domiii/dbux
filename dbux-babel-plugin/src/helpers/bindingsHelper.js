import { logInternalError } from '../log/logger';

/**
 * Find only bindings which have at least one non-instrumented path;
 * i.e. variables that exist in the original source code.
 */
export function* iterateRealBindings(path) {
  if (Array.isArray(path)) {
    for (const pathEntry of path) {
      yield * iterateRealBindings(pathEntry);
    }
  }

  const bindings = path.scope?.bindings;
  if (!bindings) {
    logInternalError(`[iterateRealVariableBindings] argument is not path or has no bindings: ${path?.toString()}`);
  }
  else {
    yield * Object.keys(bindings)
      .filter(varName => bindings[varName].referencePaths.some(path => !!path.node.loc))
      .map(varName => ([varName, bindings[varName]]));
  }
}

export function getRealVariableNames(path) {
  return Array.from(iterateRealBindings(path)).map(([name]) => name);
}