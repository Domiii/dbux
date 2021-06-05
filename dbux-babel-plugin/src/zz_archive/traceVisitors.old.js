// /**
//  * @file
//  * 
//  * NOTE: This file was originally designed to handle traces only.
//  *  Later on we encountered some real issues from trying to separate trace and context instrumentation, and did not 
//  *  have the time yet to properly separate them again. That is why there is also some context instrumentation in this file
//  */

// import nodePath from 'path';
// import cloneDeep from 'lodash/cloneDeep';
// import merge from 'lodash/merge';
// import mapValues from 'lodash/mapValues';
// import * as t from '@babel/types';
// import TraceType from '@dbux/common/src/core/constants/TraceType';
// import { newLogger } from '@dbux/common/src/log/logger';
// import EmptyObject from '@dbux/common/src/util/EmptyObject';
// import { requireAllByName } from '@dbux/common-node/src/util/requireUtil';
// import * as ParseNodeClassesByName from '../parse';
// import { traceWrapExpression, buildTraceNoValue, traceCallExpression, instrumentCallExpressionEnter, getTracePath } from '../helpers/traceHelpers.old';
// // import { loopVisitor } from './loopVisitors';
// import { isCallPath } from '../helpers/functionHelpers';
// import { awaitVisitEnter, awaitVisitExit } from './awaitVisitor';
// import { getNodeNames } from './nameVisitors';
// import { isPathInstrumented } from '../helpers/astUtil';
// import TraceInstrumentationType from '../constants/TraceInstrumentationType';
// import InstrumentationDirection from '../constants/InstrumentationDirection';
// import { pathToString } from '../helpers/pathHelpers';



// // ###########################################################################
// // old visitor code
// // ###########################################################################

// const traceCfg = (() => {
//   const {
//     NoTrace,
//     // Callee,
//     CallExpression,
//     ExpressionResult,
//     ExpressionValue,
//     // ExpressionNoValue,
//     Statement,
//     Block,
//     Loop,

//     MemberProperty,
//     MemberObject,
//     Super,
//     ReturnArgument,
//     ReturnNoArgument,
//     ThrowArgument,

//     Function: Func,
//     Await
//   } = TraceInstrumentationType;

//   return {
//     // ########################################
//     // assignments
//     // ########################################
//     AssignmentExpression: [
//       ExpressionResult,
//       // NoTrace,
//       // NOTE: when using `originalIsParent`, ExpressionStatement.expression will trigger on the entire AssignmentExpression
//       // [['right', ExpressionResult, null, { originalIsParent: true }]]
//     ],
//     VariableDeclarator: [
//       NoTrace,
//       // TODO: this is actually originalIsGrandParent: true!!
//       [['init', ExpressionResult, null, { originalIsParent: true }]]
//     ],
//     // VariableDeclaration: [
//     //   NoTrace,
//     //   null,
//     //   {
//     //     // filter(path, state) {
//     //     //   // ignore variable declarations in for loops inits
//     //     //   return !path.parentPath.isFor();
//     //     // }
//     //   }
//     // ],
//     ClassPrivateProperty: [
//       NoTrace,
//       [['value', ExpressionResult]]
//     ],
//     ClassProperty: [
//       NoTrace,
//       [['value', ExpressionResult]]
//     ],


//     // ########################################
//     // call expressions
//     // NOTE: also sync this against `isCallPath`
//     // ########################################
//     CallExpression: [
//       CallExpression,
//       // [['callee', Callee]]
//     ],
//     OptionalCallExpression: [
//       CallExpression
//     ],
//     NewExpression: [
//       CallExpression
//     ],

//     // ########################################
//     // more expressions
//     // ########################################
//     /**
//      * Ternary operator
//      */
//     ConditionalExpression: [
//       NoTrace,
//       [['test', ExpressionResult], ['consequent', ExpressionResult], ['alternate', ExpressionResult]]
//     ],

//     /**
//      * ++ and --
//      */
//     UpdateExpression: ExpressionResult,

//     YieldExpression: [
//       NoTrace,
//       [['argument', ExpressionResult]]
//     ],


//     // ########################################
//     // Data read expressions
//     // ########################################

//     BinaryExpression: [
//       NoTrace,
//       [['left', ExpressionValue], ['right', ExpressionValue]]
//     ],

//     LogicalExpression: [
//       NoTrace,
//       [['left', ExpressionValue], ['right', ExpressionValue]]
//     ],

//     // object initializer, e.g. rhs of `var o = { x: 1 }` (kind = 'init')
//     ObjectExpression: [
//       NoTrace,
//       [['properties', NoTrace,
//         [['value', ExpressionValue]],
//         { array: true }
//       ]]
//     ],

//     MemberExpression: [
//       NoTrace,
//       [['object', MemberObject], ['property', MemberProperty]]
//     ],

//     OptionalMemberExpression: [
//       NoTrace,
//       [['object', MemberObject], ['property', MemberProperty]]
//     ],

//     SequenceExpression: [
//       NoTrace,
//       [['expressions', ExpressionValue, null, { array: true }]]
//     ],

//     TemplateLiteral: [
//       NoTrace,
//       [['expressions', ExpressionValue, null, { array: true }]]
//     ],

//     UnaryExpression: [
//       NoTrace,
//       [['argument', ExpressionValue]]
//     ],

//     Super: [
//       Super
//     ],


//     // ########################################
//     // statements
//     // ########################################
//     BreakStatement: Statement,
//     ContinueStatement: Statement,
//     Decorator: [
//       // NOTE: we need to trace decorators by wrapping them in a trace decorator
//       NoTrace,
//       // [['expression', ExpressionNoValue]]
//     ],
//     // Declaration: [
//     //   Statement,
//     //   null, // no children
//     //   {
//     //     ignore: ['ImportDeclaration'] // ignore: cannot mess with imports
//     //   }
//     // ],

//     ReturnStatement: [
//       ReturnNoArgument,
//       [['argument', ReturnArgument]]
//     ],
//     ThrowStatement: [
//       NoTrace,
//       [['argument', ThrowArgument]]
//     ],


//     // ########################################
//     // loops
//     // ########################################
//     ForStatement: [
//       Loop
//     ],
//     ForInStatement: [
//       Loop
//     ],
//     ForOfStatement: [
//       Loop
//     ],
//     // TODO: babel is unhappy with any DoWhileLoop visitor
//     // DoWhileLoop: [
//     //   Loop
//     // ],
//     WhileStatement: [
//       Loop
//     ],

//     // ########################################
//     // if, else, switch, case
//     // ########################################
//     IfStatement: [
//       NoTrace,
//       [['test', ExpressionResult], ['consequent', Block], ['alternate', Block]],
//     ],
//     SwitchStatement: [
//       NoTrace,
//       [['discriminant', ExpressionResult]]
//     ],
//     // SwitchCase: [
//     // TODO: insert trace call into `consequent` array.
//     //    NOTE: we cannot just wrap the `consequent` statement array into a new block, as that will change the semantics (specifically: local variables would not be able to spill into subsequent cases)
//     //   NoTrace,
//     //   [['consequent', Block]]
//     // ],


//     // ########################################
//     // try + catch
//     // ########################################
//     TryStatement: [
//       NoTrace,
//       // [['block', Block], ['finalizer', Block]]
//     ],
//     CatchClause: [
//       NoTrace,
//       [['body', Block]]
//     ],

//     ExpressionStatement: [
//       NoTrace,
//       [['expression', ExpressionValue]]
//     ],

//     // ########################################
//     // functions
//     // ########################################
//     Function: [
//       NoTrace,
//       [['body', Func]]
//     ],

//     // ########################################
//     // await
//     // ########################################
//     AwaitExpression: [
//       Await
//     ],

//     // TODO: ParenthesizedExpression - https://github.com/babel/babel/blob/master/packages/babel-generator/src/generators/expressions.js#L27
//     // TODO: BindExpression - https://github.com/babel/babel/blob/master/packages/babel-generator/src/generators/expressions.js#L224
//     // TODO: TypeCastExpression
//     // TODO: TupleExpression - https://github.com/babel/babel/blob/f6c7bf36cec81baaba8c37e572985bb59ca334b1/packages/babel-generator/src/generators/types.js#L139
//   };
// })();


// // ###########################################################################
// // config
// // ###########################################################################

// function validateCfgNode(name, node) {
//   const { visitorName, instrumentationType, children, nodeCfg } = node;

//   if (!visitorName || instrumentationType === undefined) {
//     throw new Error(`invalid traceType in cfgNode: ${name} - ${JSON.stringify(node)}`);
//   }

//   // make sure, it has a valid type
//   TraceInstrumentationType.nameFromForce(instrumentationType);
// }

// function validateCfg(cfg) {
//   for (const name in cfg) {
//     const nodeCfg = cfg[name];
//     validateCfgNode(name, nodeCfg);
//     // const {traceType, children, extraCfg} = nodeCfg;
//     // for (const child of children) {
//     //   ...
//     // }
//   }
// }

// function normalizeConfigNode(parentCfg, visitorName, cfgNode) {
//   if (!Array.isArray(cfgNode)) {
//     // no children
//     cfgNode = [cfgNode];
//   }

//   let [instrumentationType, children, extraCfg] = cfgNode;
//   if (extraCfg?.include) {
//     // convert to set
//     extraCfg.include = new Set(extraCfg.include);
//   }

//   cfgNode = {
//     visitorName,
//     instrumentationType,
//     children,
//     extraCfg,
//     parentCfg
//   };

//   if (children) {
//     if (!Array.isArray(children)) {
//       throw new Error('invalid config node. `children` must be an array of arrays for visitor: ' + JSON.stringify(visitorName));
//     }
//     cfgNode.children = children.map(([childName, ...childCfg]) => {
//       return normalizeConfigNode(cfgNode, childName, childCfg);
//     });
//   }
//   return cfgNode;
// }

// function normalizeConfig(cfg) {
//   for (const visitorName in cfg) {
//     const cfgNode = cfg[visitorName];
//     cfg[visitorName] = normalizeConfigNode(null, visitorName, cfgNode);
//   }

//   validateCfg(cfg);

//   return cfg;
// }

// // ###########################################################################
// // ENTER instrumentors
// // ###########################################################################

// function enterExpression(traceResultType, path, state) {

//   // we want to trace CallResult on exit
//   if (!path.getData('traceResultType')) {
//     path.setData('traceResultType', traceResultType);
//   }
//   return null;
// }

// const enterInstrumentors = {
//   ReturnNoArgument(path, state) {
//     if (!path.node.argument) {
//       // insert trace before `return;` statement
//       const beforeReturn = buildTraceNoValue(path, state, TraceType.ReturnNoArgument);
//       path.insertBefore(beforeReturn);
//     }

//     // don't handle the argument case here
//     return null;
//   },

//   ReturnArgument(path, state) {
//     // trace `arg` in `return arg;`
//     return enterExpression(TraceType.ReturnArgument, path, state);
//   },

//   ThrowArgument(path, state) {
//     return enterExpression(TraceType.ThrowArgument, path, state);
//   },

//   // Function: functionVisitEnter,
//   Await: awaitVisitEnter
// };


// // ###########################################################################
// // EXIT instrumentors
// // ###########################################################################

// function wrapExpression(traceType, path, state) {
//   let tracePath = getTracePath(path);

//   if (traceType === TraceType.ExpressionResult) {
//     traceType = path.getData('traceResultType') || traceType;
//   }
//   return traceWrapExpression(traceType, path, state, tracePath);
// }

// /**
//  * NOTE: we have these specifically for expressions that
//  * potentially can be `CallExpression`.
//  */
// const exitInstrumentors = {
//   ExpressionValue(pathOrPaths, state) {
//     if (Array.isArray(pathOrPaths)) {
//       // e.g. `SequenceExpression`
//       for (const path of pathOrPaths) {
//         wrapExpression(TraceType.ExpressionValue, path, state);
//       }
//       return null;  // returning originalPaths is currently meanignless since `path.get` would not work on it
//     }
//     else {
//       return wrapExpression(TraceType.ExpressionValue, pathOrPaths, state);
//     }
//   },
//   // Super(path, state) {
//   //   // NOTE: for some reason, `Super` visitor does not get picked up by Babel
//   // },

//   ReturnArgument(path, state) {
//     // trace `arg` in `return arg;`
//     return wrapExpression(TraceType.ReturnArgument, path, state);
//   },

//   ThrowArgument(path, state) {
//     return wrapExpression(TraceType.ThrowArgument, path, state);
//   },
// };

// // ###########################################################################
// // children
// // ###########################################################################

// // const PendingVisitorsTag = '_pendingVisitors';

// // function pushChildVisitors(path, children) {
// //   if (!children) {
// //     return;
// //   }

// //   for (const child of children) {
// //     // const {childName, ...childCfg} = child;
// //     const childPath = path.get(childName);

// //     if (childPath.node) {
// //       let pendingVisitors = childPath.getData(PendingVisitorsTag);
// //       if (!pendingVisitors) {
// //         childPath.setData(PendingVisitorsTag, pendingVisitors = []);
// //       }
// //       pendingVisitors.push(child);
// //     }
// //   }
// // }

// // function popVisitors(path, state) {
// //   const children = path.getData(PendingVisitorsTag);
// //   if (!children) {
// //     return;
// //   }

// //   visitEnterAll(children);
// // }

// function visitChildren(visitFn, childCfgs, path, state) {
//   for (const childCfg of childCfgs) {
//     const { visitorName } = childCfg;
//     if (path.node?.[visitorName]) {
//       let childPathes = path.get(visitorName);
//       if (Array.isArray(childPathes)) {
//         for (let childPath of childPathes) {
//           visitFn(childPath, state, childCfg);
//         }
//       }
//       else {
//         if (childCfg.extraCfg?.isArray) {
//           warn(`in "${state.filePath}": instrumenting path that should be (but is not) array: ${childPathes.toString()} (${childPathes.node.type})`);
//         }

//         visitFn(childPathes, state, childCfg);
//       }
//     }
//   }
// }


// function visitEnterAll(cfgNodes, path, state) {
//   // return visitChildren(visitEnter, cfgNodes, path, state);
// }

// function visitExitAll(cfgNodes, path, state) {
//   // return visitChildren(visitExit, cfgNodes, path, state);
// }

// // ###########################################################################
// // visitors
// // ###########################################################################

// function visit(direction, onTrace, instrumentors, path, state, cfg) {
//   const { instrumentationType, children, extraCfg } = cfg;
//   if (extraCfg?.ignore?.includes(path.node.type)) {
//     // ignore (array of type name)
//     return;
//   }
//   if (extraCfg?.filter && !extraCfg.filter(path, state, cfg)) {
//     // filter (custom function)
//     return;
//   }

//   if (!instrumentationType && !children) {
//     return;
//   }

//   // mark as visited;
//   let shouldVisit = false;
//   let instrumentor;
//   if (instrumentationType && !isPathInstrumented(path)) {
//     Verbose && logInst('v', cfg, path, direction);
//     instrumentor = getInstrumentor(instrumentors, instrumentationType);
//     shouldVisit = instrumentor && onTrace(path); // instrumentor && !hasVisited

//     if (direction === InstrumentationDirection.Enter) {
//       // store config override on enter
//       if (extraCfg) {
//         let existedCfg = cloneDeep(path.getData('visitorCfg')) || EmptyObject;
//         merge(existedCfg, extraCfg);
//         path.setData('visitorCfg', existedCfg);
//       }
//     }
//   }

//   if (!shouldVisit) {
//     return;
//   }

//   const ParserNodeClazz = getParserNodeClassByName(path);

//   if (direction === InstrumentationDirection.Enter) {
//     // -> Enter
//     (ParserNodeClazz && state.stack.enter(path, state, ParserNodeClazz));

//     // // 1. instrument self
//     // shouldVisit && instrumentPath(direction, instrumentor, path, state, cfg);

//     // // 2. visit children
//     // children && visitEnterAll(children, path, state);
//   }
//   else {
//     // <- Exit

//     // // 1. visit children
//     // children && visitExitAll(children, path, state);

//     // // 2. instrument self
//     // shouldVisit && instrumentPath(direction, instrumentor, path, state, cfg);

//     (ParserNodeClazz && state.stack.exit(path, state, ParserNodeClazz));
//   }
// }

// function getInstrumentor(instrumentors, instrumentationType) {
//   // NOTE: a TraceType might not have an instrumentor both on `Enter` as well as `Exit`
//   const instrumentationTypeName = TraceInstrumentationType.nameFromForce(instrumentationType);
//   // if (!instrumentors[traceTypeName]) {
//   //   err('instrumentors are missing TraceType:', traceTypeName);
//   // }
//   const instrumentor = instrumentors[instrumentationTypeName];
//   if (instrumentor && !(instrumentor instanceof Function)) {
//     logError('instrumentor is not a function:', instrumentationTypeName, '-', instrumentor);
//     return null;
//   }
//   return instrumentor;
// }

// function instrumentPath(direction, instrumentor, path, state, cfg) {
//   // log
//   Verbose > 1 && logInst('II', cfg, path, direction);

//   // actual instrumentation
//   const { extraCfg } = cfg;
//   if (extraCfg?.array) {
//     if (!Array.isArray(path)) {
//       instrumentor(path, state);
//     }
//     else {
//       // path is an array
//       for (const p of path) {
//         // const originalPath =
//         instrumentor(p, state);
//       }
//     }
//   }
//   else {
//     // const originalPath = 
//     instrumentor(path, state);
//   }

//   // TODO: remember originalPath for further processing?
//   // if (originalPath) {
//   //   path = originalPath;
//   // }
// }


// // ###########################################################################
// // utilities
// // ###########################################################################

// // function err(message, obj) {
// //   throw new Error(message + (obj && (' - ' + JSON.stringify(obj)) || ''));
// // }



// function _getFullName(cfg) {
//   const { parentCfg,
//     // instrumentationType,
//     visitorName
//   } = cfg;
//   // const baseInstrumentationType = parentCfg?.instrumentationType || instrumentationType;
//   // const baseName = TraceInstrumentationType.nameFromForce(baseInstrumentationType);
//   if (parentCfg) {
//     return `${_getFullName(parentCfg)}.${visitorName}`;
//   }
//   return visitorName;
// }
