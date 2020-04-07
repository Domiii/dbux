// import { logInternalError } from '../log/logger';
// import EmptyObject from 'dbux-common/src/util/EmptyObject';
// import { isInLoc1D } from './locHelpers';
// import { isNodeInstrumented } from './instrumentationHelper';

// /**
//  * Find only bindings which have at least one non-instrumented path;
//  * i.e. variables that exist in the original source code.
//  */
// export function* iterateBindings(path) {
//   if (Array.isArray(path)) {
//     for (const pathEntry of path) {
//       yield* iterateBindings(pathEntry);
//     }
//   }

//   const bindings = path.scope?.bindings;
//   if (!bindings) {
//     logInternalError(`[iterateRealVariableBindings] argument is not path or has no bindings: ${path?.toString()}`);
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