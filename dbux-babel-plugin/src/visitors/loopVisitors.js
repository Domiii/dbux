// import * as t from '@babel/types';
// import LoopType from '@dbux/common/src/core/constants/LoopType';
// import { EmptyObject } from '@dbux/common/src/util/EmptyObject';
// import { logInternalError } from '../log/logger';
// import { extractSourceStringWithoutCommentsAtLoc } from '../helpers/sourceHelpers';
// import { callDbuxMethod } from '../helpers/callHelpers';

// // ###########################################################################
// // Loop types
// // ###########################################################################

// const loopTypesByNodeTypeName = {
//   ForStatement: LoopType.For,
//   ForInStatement: LoopType.ForIn,
//   ForOfStatement: LoopType.ForOf,
//   WhileStatement: LoopType.While,
//   DoWhileStatement: LoopType.DoWhile
// };

// function getLoopType(isForAwaitOf, nodeTypeName) {
//   if (isForAwaitOf) {
//     return LoopType.ForAwaitOf;
//   }

//   const loopType = loopTypesByNodeTypeName[nodeTypeName];
//   if (!loopType) {
//     logInternalError('unrecognized loop node type name:', nodeTypeName);
//   }
//   return loopType;
// }


// // ###########################################################################
// // helpers
// // ###########################################################################


// /**
//  * Get string representation of loop head.
//  */
// function getLoopDisplayName(state, loopHeadLoc, loopType) {
//   const displayName = (extractSourceStringWithoutCommentsAtLoc(loopHeadLoc, state) || `${LoopType.nameFrom(loopType)}-loop`).trim();
//   return displayName;
// }

// function addLoopStaticVars(path, state, loopId, loopHeadLoc) {
//   // TODO
//   // return addStaticVars();
// }

// // ###########################################################################
// // actual instrumentation
// // ###########################################################################

// /**
//  * Instrumentation of `for-await-of` loops:
//  * 
//  * `for await (const left of dbux.wrapAsyncIterator(right)) { ... }`
//  */
// function instrumentForAwaitOfLoop(path, state) {
//   /**
//      * TODO: Handle `for await of`
//      * explanation:
//      *    `for await (const x of xs) { f(x); g(x); }` is like sugar of:
//      *    `for (const (x = await _x) of (async xs)) { f(x); g(x); }`
//      *    (it calls y[Symbol.asyncIterator]() instead of y[Symbol.iterator]())
//      * @see https://www.codementor.io/@tiagolopesferreira/asynchronous-iterators-in-javascript-jl1yg8la1
//      * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of
//      * @see https://github.com/babel/babel/issues/4969
//      * @see https://babeljs.io/docs/en/babel-types#forofstatement
//    */

//   // `for await (const left of dbux.wrapAsyncIterator(right)) { ... }`
// }


// export function instrumentLoopBodyDefault(bodyPath, state, staticVars) {
//   //t.expressionStatement(
//   // TODO: figure out how to store loop vars
//   const varRegisterCall = callDbuxMethod(state, 'pushLoop',
//     loopId,
//     staticVars.map(
//       staticVar => ([
//         t.numericLiteral(staticVar._staticId),
//         t.identifier(staticVar.name)
//       ])
//     )
//   );


//   // TODO: push + pop Loops; then add LoopIterations

// }


// // ###########################################################################
// // core
// // ###########################################################################



// export function loopVisitor(path, state) {
//   // Loop, 
//   //  [['test', ExpressionResult], ['update', ExpressionResult], ['body', LoopBlock]]
//   //  [['test', ExpressionResult], ['body', LoopBlock]]


//   const bodyPath = path.get('body');

//   const isForAwaitOf = path.isForOfStatement() && path.node.await;
//   const loopType = getLoopType(isForAwaitOf, path.node.type);
//   const loopHeadLoc = getPreBodyLoc(path);
//   const displayName = getLoopDisplayName(state, loopHeadLoc, loopType);

//   // add loop
//   const staticLoopId = state.addLoop(path, loopType, loopHeadLoc, displayName);

//   // add loop vars
//   addLoopStaticVars(path, state, staticLoopId, loopHeadLoc);

//   // TODO: wrap entire loop in try/finally and push/pop loop

//   if (isForAwaitOf) {
//     instrumentForAwaitOfLoop(path, state);
//   }
//   else {
//     instrumentLoopBodyDefault(bodyPath, state, staticVars);
//   }
// }