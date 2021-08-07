/**
 * Bindings usually refer to "creations" of variables, 
 * such as declarations, parameters, module exports etc.
 * 
 * @file
 * 
 * class `Binding`:
 * @see https://github.com/babel/babel/blob/main/packages/babel-traverse/src/scope/binding.ts#L5
 * 
 * `registerDeclaration`:
 * @see https://github.com/babel/babel/blob/672a58660f0b15691c44582f1f3fdcdac0fa0d2f/packages/babel-traverse/src/scope/index.ts#L646
 * 
 * binding collision logic:
 * @see https://github.com/babel/babel/blob/672a58660f0b15691c44582f1f3fdcdac0fa0d2f/packages/babel-traverse/src/scope/index.ts#L515
 */

import { astNodeToString, pathToString, pathToStringAnnotated } from './pathHelpers';

// import EmptyObject from '@dbux/common/src/util/EmptyObject';
// import { isInLoc1D } from './locHelpers';
// import { isNodeInstrumented } from './astUtil';

/** @typedef { import("@babel/types").Node } AstNode */
/** @typedef { import("@babel/traverse").NodePath } NodePath */

// /**
//  * Find only bindings which have at least one non-instrumented path;
//  * i.e. variables that exist in the original source code.
//  */
// export function* iterateBindings(path) {
//   if (Array.isArray(path)) {
//     for (const pathEntry of path) {
//       yield* iterateBindings(pathEntry);
//     }
//     return;
//   }

//   const bindings = path.scope?.bindings;
//   if (!bindings) {
//     logInternalError(`[iterateRealVariableBindings] argument is not path or has no bindings: ${path.toString()}`);
//   }
//   else {
//     yield* Object.keys(bindings)
//       .filter(varName => 
//         !isNodeInstrumented(bindings[varName].identifier) ||
//         bindings[varName].referencePaths.some(varPath => !isNodeInstrumented(varPath.node)))
//       .map(varName => ([varName, bindings[varName]]));
//   }
// }

// // export function getAllBoundVariable(path) {
// //   return Array.from(iterateBindings(path)).map(([name]) => name);
// // }

// export function getClosestScopedPath(path) {
//   let current = path;
//   do {
//     if (current.scope) {
//       return current;
//     }
//     current = path.parentPath;
//   }
//   while (current);

//   return null;
// }

// /**
//  * 
//  */
// export function iterateVarAccessInLoc1D(path, containingLoc1D, cb) {
//   const scopedPath = getClosestScopedPath(path);
//   const bindings = scopedPath?.scope?.bindings || EmptyObject;
//   const varNames = Object.keys(bindings);

//   // see: https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#bindings
//   for (const varName of varNames) {
//     const binding = bindings[varName];
//     const {
//       referencePaths,
//       identifier,
//       constantViolations
//     } = binding;

//     if (isNodeInstrumented(identifier)) {
//       // skip: variable injected by instrumentation, not in original source code
//       continue;
//     }

//     if (isInLoc1D(identifier, containingLoc1D)) {
//       // add declaration
//       cb(identifier.name, identifier, false);
//     }

//     // add all accesses
//     // WARNING: `referencePaths` only contains reads of given indentifier in given scope. It does not seem like they can ever count as constantViolations.
//     for (const varPath of referencePaths) {
//       if (isInLoc1D(varPath.node, containingLoc1D)) {
//         // add var access

//         // TODO: const initializer is "write" as well (but not a violation)

//         const isWrite = !constantViolations.includes(varPath);
//         // yield { varPath, name: identifier.name, isWrite };
//         cb(identifier.name, varPath, isWrite);
//       }
//     }
//   }
// }

// export function getRealVariableNamesInLoc1D(path, loc1D) {
//   const names = [];
//   iterateVarAccessInLoc1D(path, loc1D, (name) => names.push(name));
//   return names;
// }

// /**
//  * @return {Binding} The binding that creates/declares the given identifier (if it can be found).
//  */
// export function getBinding(idPath) {
//   crawl(idPath);
//   // NOTE: there is also `getAllBindings`
//   return idPath.scope.getBinding((idPath.node).name);
// }

// /**
//  * Crawl: "Manually reprocess this scope to ensure that the moved params are updated."
//  * @see https://github.com/babel/babel/blob/672a58660f0b15691c44582f1f3fdcdac0fa0d2f/packages/babel-traverse/src/scope/index.ts#L863
//  */
// function crawl(path) {
//   // NOTE: only need to crawl after bindings have changed, so probably not necessary
//   // path.scope.crawl();
// }

/**
 * 
 * @returns {Path} The path that creates/declares the given identifier.
 */
export function getBindingPath(idPath) {
  return getPathBinding(idPath)?.path;
}


/**
 * @type {NodePath[]}
 * @see https://github.com/babel/babel/tree/master/packages/babel-traverse/src/path/family.js#L215
 * @see https://github.com/babel/babel/tree/master/packages/babel-traverse/src/path/lib/virtual-types.js
 */
export function getBindingIdentifierPaths(path) {
  /**
   * @type {{ [string]: NodePath }}
   */
  const pathsByName = path.getBindingIdentifierPaths();
  return Object.values(pathsByName);
}

/**
 * Returns whether the given binding is the binding of the given path.
 */
export function isPathBinding(binding, path) {
  return binding.identifier === path.node || binding.referencePaths.includes(path);
}

/**
 * Get the binding of the given path.
 */
export function getPathBinding(path) {
  // for reference: https://github.com/babel/babel/blob/672a58660f0b15691c44582f1f3fdcdac0fa0d2f/packages/babel-traverse/src/scope/index.ts#L215
  let binding;

  let { scope } = path;
  let lastScope = scope;

  // eslint-disable-next-line no-empty
  while (path.node && scope &&
    (binding = scope.getBinding(path.node.name)) &&
    !isPathBinding(binding, path)
  ) {
    // console.warn('binding', path.node.name, `scope=${scope.path.node.type}`, astNodeToString(binding.identifier), pathToStringAnnotated(path));
    lastScope = scope;
    scope = scope.parent;
  }

  binding = binding || lastScope.getBinding(path.node.name);

  return binding;
}
