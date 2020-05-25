/**
 * @file
 * 
 * NOTE: This file was originally designed to handle traces only.
 *  Later on we encountered some real issues from trying to separate trace and context instrumentation, and did not 
 *  have the time yet to properly separate them again. That is why there is also some context instrumentation in this file
 */

import Enum from 'dbux-common/src/util/Enum';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import { newLogger } from 'dbux-common/src/log/logger';
import truncate from 'lodash/truncate';
import { traceWrapExpression, traceBeforeExpression, buildTraceNoValue, traceCallExpression, traceBeforeSuper, instrumentBeforeCallExpression, getTracePath } from '../helpers/traceHelpers';
import { loopVisitor } from './loopVisitors';
import { getPathTraceId } from '../data/StaticTraceCollection';
import { isCallPath } from '../helpers/functionHelpers';
import { functionVisitEnter } from './functionVisitor';
import { awaitVisitEnter } from './awaitVisitor';
import { getNodeNames } from './nameVisitors';
import { isPathInstrumented } from '../helpers/instrumentationHelper';

const Verbose = false;
// const Verbose = true;

const { log, debug, warn, error: logError } = newLogger('traceVisitors');


const TraceInstrumentationType = new Enum({
  NoTrace: 0,
  Callee: 1,
  CallExpression: 2,
  /**
   * Result of a computation
   */
  ExpressionResult: 3,
  /**
   * Only keeping track of data
   */
  ExpressionValue: 4,
  // ExpressionNoValue: 3,
  Statement: 5,
  Block: 6,
  Loop: 7,

  // Special attention required for these
  MemberProperty: 8,
  MemberObject: 9,
  Super: 10,
  ReturnArgument: 11,
  ReturnNoArgument: 12,
  ThrowArgument: 13,

  Function: 14,
  Await: 15
});

const InstrumentationDirection = {
  Enter: 1,
  Exit: 2
};

const traceCfg = (() => {
  const {
    NoTrace,
    Callee,
    CallExpression,
    ExpressionResult,
    ExpressionValue,
    // ExpressionNoValue,
    Statement,
    Block,
    Loop,

    MemberProperty,
    MemberObject,
    Super,
    ReturnArgument,
    ReturnNoArgument,
    ThrowArgument,

    Function: Func,
    Await
  } = TraceInstrumentationType;

  return {
    // ########################################
    // assignments
    // ########################################
    AssignmentExpression: [
      // ExpressionResult,
      NoTrace,
      [['right', ExpressionResult, null, { originalIsParent: true }]]
    ],
    VariableDeclarator: [
      NoTrace,
      [['init', ExpressionResult, null, { originalIsParent: true }]]
    ],
    // VariableDeclaration: [
    //   NoTrace,
    //   null,
    //   {
    //     // filter(path, state) {
    //     //   // ignore variable declarations in for loops inits
    //     //   return !path.parentPath.isFor();
    //     // }
    //   }
    // ],
    ClassPrivateProperty: [
      NoTrace,
      [['value', ExpressionResult]]
    ],
    ClassProperty: [
      NoTrace,
      [['value', ExpressionResult]]
    ],


    // ########################################
    // call expressions
    // NOTE: also sync this against `isCallPath`
    // ########################################
    CallExpression: [
      CallExpression,
      [['callee', Callee]]
    ],
    OptionalCallExpression: [
      CallExpression
    ],
    NewExpression: [
      CallExpression
    ],

    // ########################################
    // more expressions
    // ########################################
    /**
     * Ternary operator
     */
    ConditionalExpression: [
      ExpressionResult,
      [['test', ExpressionResult], ['consequent', ExpressionResult], ['alternate', ExpressionResult]]
    ],
    UpdateExpression: ExpressionResult,
    YieldExpression: [
      NoTrace,
      [['argument', ExpressionResult]]
    ],


    // ########################################
    // Data read expressions
    // ########################################

    BinaryExpression: [
      NoTrace,
      [['left', ExpressionValue], ['right', ExpressionValue]]
    ],

    LogicalExpression: [
      NoTrace,
      [['left', ExpressionValue], ['right', ExpressionValue]]
    ],

    MemberExpression: [
      NoTrace,
      [['object', MemberObject], ['propery', MemberProperty]]
    ],

    OptionalMemberExpression: [
      NoTrace,
      [['object', MemberObject], ['propery', MemberProperty]]
    ],

    SequenceExpression: [
      NoTrace,
      [['expressions', ExpressionValue, null, { array: true }]]
    ],

    TemplateLiteral: [
      NoTrace,
      [['expressions', ExpressionValue, null, { array: true }]]
    ],

    UnaryExpression: [
      NoTrace,
      [['argument', ExpressionValue]]
    ],

    Super: [
      Super
    ],


    // ########################################
    // statements
    // ########################################
    BreakStatement: Statement,
    ContinueStatement: Statement,
    Decorator: [
      NoTrace,
      // [['expression', ExpressionNoValue]]
    ],
    // Declaration: [
    //   Statement,
    //   null, // no children
    //   {
    //     ignore: ['ImportDeclaration'] // ignore: cannot mess with imports
    //   }
    // ],

    ReturnStatement: [
      ReturnNoArgument,
      [['argument', ReturnArgument]]
    ],
    ThrowStatement: [
      NoTrace,
      [['argument', ThrowArgument]]
    ],


    // ########################################
    // loops
    // ########################################
    ForStatement: [
      Loop
    ],
    ForInStatement: [
      Loop
    ],
    ForOfStatement: [
      Loop
    ],
    DoWhileLoop: [
      // TODO: currently disabled because babel doesn't like it; probably a babel bug?
      Loop
    ],
    WhileStatement: [
      Loop
    ],

    // ########################################
    // if, else, switch, case
    // ########################################
    IfStatement: [
      NoTrace,
      [['test', ExpressionResult], ['consequent', Block], ['alternate', Block]],
    ],
    SwitchStatement: [
      NoTrace,
      [['discriminant', ExpressionResult]]
    ],
    // SwitchCase: [
    // TODO: insert trace call into `consequent` array.
    //    NOTE: we cannot just wrap the `consequent` statement array into a new block, as that will change the semantics (specifically: local variables would not be able to spill into subsequent cases)
    //   NoTrace,
    //   [['consequent', Block]]
    // ],


    // ########################################
    // try + catch
    // ########################################
    TryStatement: [
      NoTrace,
      // [['block', Block], ['finalizer', Block]]
    ],
    CatchClause: [
      NoTrace,
      [['body', Block]]
    ],

    ExpressionStatement: [
      NoTrace,
      [['expression', ExpressionValue]]
    ],

    // ########################################
    // functions
    // ########################################
    Function: [
      NoTrace,
      [['body', Func]]
    ],

    // ########################################
    // await
    // ########################################
    AwaitExpression: [
      Await
    ],

    // TODO: ParenthesizedExpression - https://github.com/babel/babel/blob/master/packages/babel-generator/src/generators/expressions.js#L27
    // TODO: BindExpression - https://github.com/babel/babel/blob/master/packages/babel-generator/src/generators/expressions.js#L224
    // TODO: TypeCastExpression
    // TODO: TupleExpression - https://github.com/babel/babel/blob/f6c7bf36cec81baaba8c37e572985bb59ca334b1/packages/babel-generator/src/generators/types.js#L139
  };
})();


// ###########################################################################
// config
// ###########################################################################

function validateCfgNode(name, node) {
  const { visitorName, instrumentationType, children, nodeCfg } = node;

  if (!visitorName || instrumentationType === undefined) {
    throw new Error(`invalid traceType in cfgNode: ${name} - ${JSON.stringify(node)}`);
  }

  // make sure, it has a valid type
  TraceInstrumentationType.nameFromForce(instrumentationType);
}

function validateCfg(cfg) {
  for (const name in cfg) {
    const nodeCfg = cfg[name];
    validateCfgNode(name, nodeCfg);
    // const {traceType, children, extraCfg} = nodeCfg;
    // for (const child of children) {
    //   ...
    // }
  }
}

function normalizeConfigNode(parentCfg, visitorName, cfgNode) {
  if (!Array.isArray(cfgNode)) {
    // no children
    cfgNode = [cfgNode];
  }

  let [instrumentationType, children, extraCfg] = cfgNode;
  if (extraCfg?.include) {
    // convert to set
    extraCfg.include = new Set(extraCfg.include);
  }

  cfgNode = {
    visitorName,
    instrumentationType,
    children,
    extraCfg,
    parentCfg
  };

  if (children) {
    if (!Array.isArray(children)) {
      throw new Error('invalid config node. Children must be an array of arrays: ' + JSON.stringify(visitorName));
    }
    cfgNode.children = children.map(([childName, ...childCfg]) => {
      return normalizeConfigNode(cfgNode, childName, childCfg);
    });
  }
  return cfgNode;
}

function normalizeConfig(cfg) {
  for (const visitorName in cfg) {
    const cfgNode = cfg[visitorName];
    cfg[visitorName] = normalizeConfigNode(null, visitorName, cfgNode);
  }

  validateCfg(cfg);

  return cfg;
}

// ###########################################################################
// ENTER instrumentors
// ###########################################################################

function enterExpression(traceType, path, state) {
  if (isCallPath(path)) {
    // some of the ExpressionResult + ExpressionValue nodes we are interested in, might also be CallExpressions
    return enterCallExpression(traceType, path, state);
  }
  return null;
}

function enterCallExpression(callResultType, path, state) {
  // CallExpression

  // special treatment for `super`
  const calleePath = path.get('callee');
  if (calleePath.isSuper()) {
    traceBeforeSuper(calleePath, state);
  }
  else {
    path = instrumentBeforeCallExpression(path, state);
  }

  // trace CallResult (on exit)
  path.setData('callResultType', callResultType);
}

const enterInstrumentors = {
  CallExpression(path, state) {
    return enterCallExpression(TraceType.CallExpressionResult, path, state);
  },
  ExpressionResult(path, state) {
    return enterExpression(null, path, state);
  },
  // ExpressionValue(pathOrPaths, state) {
  //   if (Array.isArray(pathOrPaths)) {
  //     // e.g. `SequenceExpression`
  //     for (const path of pathOrPaths) {
  //       beforeExpression(TraceType.ExpressionValue, path, state);
  //     }
  //     return null;  // returning originalPaths is currently meanignless since `path.get` would not work on it
  //   }
  //   else {
  //     return beforeExpression(TraceType.ExpressionValue, pathOrPaths, state);
  //   }
  // },

  MemberProperty(propertyPath, state) {
    const path = propertyPath.parentPath;
    if (path.node.computed) {
      return enterExpression(TraceType.ExpressionValue, propertyPath, state);
    }
    return null;
  },

  MemberObject(objPath, state) {
    if (objPath.isSuper()) {
      // NOTE: this will inject a node before its *ancestor statement*
      return traceBeforeSuper(objPath, state);
    }
    else {
      // trace object (e.g. `x` in `x.y`) as-is
      return enterExpression(TraceType.ExpressionValue, objPath, state, null, false);
    }
  },

  Statement(path, state) {
    const traceStart = buildTraceNoValue(path, state, TraceType.Statement);
    path.insertBefore(traceStart);
  },
  Block(path, state) {
    // NOTE: don't change order of statements here. We first MUST build all new nodes
    //    before instrumenting the path (because instrumentation causes the path to lose information)
    const trace = buildTraceNoValue(path, state, TraceType.BlockStart);
    const traceEnd = buildTraceNoValue(path, state, TraceType.BlockEnd);

    path.insertBefore(trace);
    path.insertAfter(traceEnd);
    // if (!t.isBlockStatement(path)) {
    //   // make a new block

    // }
    // else {
    //   // insert at the top of existing block
    // }
  },
  Loop(path, state) {
    loopVisitor(path, state);
  },

  ReturnNoArgument(path, state) {
    if (!path.node.argument) {
      // insert trace before `return;` statement
      const beforeReturn = buildTraceNoValue(path, state, TraceType.ReturnNoArgument);
      path.insertBefore(beforeReturn);
    }

    // don't handle the argument case here
    return null;
  },

  ReturnArgument(path, state) {
    // trace `arg` in `return arg;`
    return enterExpression(TraceType.ReturnArgument, path, state);
  },

  ThrowArgument(path, state) {
    return enterExpression(TraceType.ThrowArgument, path, state);
  },

  Function: functionVisitEnter,
  Await: awaitVisitEnter
};


// ###########################################################################
// EXIT instrumentors
// ###########################################################################

// function wrapExpressionExit(path, state, traceType) {
//   if (isCallPath(path)) {
//     return exitCallExpression(path, state, traceType);
//   }  
// }

function wrapExpression(traceType, path, state) {
  let tracePath = getTracePath(path);

  if (isCallPath(path)) {
    return wrapCallExpression(path, state);
  }

  if (traceType === TraceType.ExpressionResult) {
    traceType = path.getData('resultType') || traceType;
  }
  return traceWrapExpression(traceType, path, state, tracePath);
}

function wrapCallExpression(path, state) {
  // CallExpression
  // instrument args after everything else has already been done

  // const calleePath = path.get('callee');
  // const beforeCallTraceId = getPathTraceId(calleePath);
  // traceCallExpression(path, state, beforeCallTraceId);

  // TODO: instrument BCE as well, here

  const callResultType = path.getData('callResultType') || TraceType.CallExpressionResult;
  return traceCallExpression(path, state, callResultType);
}

/**
 * NOTE: we have these specifically for expressions that
 * potentially can be `CallExpression`.
 */
const exitInstrumentors = {
  CallExpression(path, state) {
    return wrapExpression(null, path, state);
  },
  ExpressionResult(path, state) {
    return wrapExpression(TraceType.ExpressionResult, path, state);
  },
  ExpressionValue(pathOrPaths, state) {
    if (Array.isArray(pathOrPaths)) {
      // e.g. `SequenceExpression`
      for (const path of pathOrPaths) {
        wrapExpression(TraceType.ExpressionValue, path, state);
      }
      return null;  // returning originalPaths is currently meanignless since `path.get` would not work on it
    }
    else {
      return wrapExpression(TraceType.ExpressionValue, pathOrPaths, state);
    }
  },
  MemberProperty(propertyPath, state) {
    const path = propertyPath.parentPath;
    if (path.node.computed) {
      return wrapExpression(TraceType.ExpressionValue, propertyPath, state);
    }
    return null;
  },

  MemberObject(objPath, state) {
    if (objPath.isSuper()) {
      // nothing to do here
      return null;
    }
    else {
      // trace object (e.g. `x` in `x.y`) as-is
      wrapExpression(TraceType.ExpressionValue, objPath, state, null, false);

      // NOTE: the `originalPath` is not maintained
      return null;
    }
  },
  // Super(path, state) {
  //   // NOTE: for some reason, `Super` visitor does not get picked up by Babel
  // },

  ReturnArgument(path, state) {
    // trace `arg` in `return arg;`
    return wrapExpression(TraceType.ReturnArgument, path, state);
  },

  ThrowArgument(path, state) {
    return wrapExpression(TraceType.ThrowArgument, path, state);
  },
};

// ###########################################################################
// children
// ###########################################################################

// const PendingVisitorsTag = '_pendingVisitors';

// function pushChildVisitors(path, children) {
//   if (!children) {
//     return;
//   }

//   for (const child of children) {
//     // const {childName, ...childCfg} = child;
//     const childPath = path.get(childName);

//     if (childPath.node) {
//       let pendingVisitors = childPath.getData(PendingVisitorsTag);
//       if (!pendingVisitors) {
//         childPath.setData(PendingVisitorsTag, pendingVisitors = []);
//       }
//       pendingVisitors.push(child);
//     }
//   }
// }

// function popVisitors(path, state) {
//   const children = path.getData(PendingVisitorsTag);
//   if (!children) {
//     return;
//   }

//   visitEnterAll(children);
// }

function visitChildren(visitFn, childCfgs, path, state) {
  for (const childCfg of childCfgs) {
    const { visitorName } = childCfg;
    if (path.node?.[visitorName]) {
      const childPath = path.get(visitorName);
      // console.debug(visitorName, childPath?.toString() || 'undefined', childPath?.getData);
      visitFn(childPath, state, childCfg);
    }
  }
}


function visitEnterAll(cfgNodes, path, state) {
  return visitChildren(visitEnter, cfgNodes, path, state);
}

function visitExitAll(cfgNodes, path, state) {
  return visitChildren(visitExit, cfgNodes, path, state);
}

// ###########################################################################
// visitors
// ###########################################################################

function visit(direction, onTrace, instrumentors, path, state, cfg) {
  const { instrumentationType, children, extraCfg } = cfg;
  if (extraCfg?.ignore?.includes(path.node.type)) {
    // ignore (array of type name)
    return;
  }
  if (extraCfg?.filter && !extraCfg.filter(path, state, cfg)) {
    // filter (custom function)
    return;
  }

  if (!instrumentationType && !children) {
    return;
  }

  // mark as visited;
  let shouldVisit = false;
  let instrumentor;
  if (instrumentationType && !isPathInstrumented(path)) {
    Verbose && logInst('v', cfg, path, direction);
    instrumentor = getInstrumentor(instrumentors, instrumentationType);
    shouldVisit = instrumentor && onTrace(path); // instrumentor && !hasVisited

    if (direction === InstrumentationDirection.Enter) {
      // store config on enter
      if (extraCfg) {
        if (path.getData('visitorCfg')) {
          // ideally, there should not be such a conflict
          logError('config override at path - old:', path.getData('visitorCfg'), ', new:', extraCfg);
        }
        path.setData('visitorCfg', extraCfg);
      }
    }
  }

  if (direction === InstrumentationDirection.Enter) {
    // -> Enter

    // 1. instrument self
    shouldVisit && instrumentPath(direction, instrumentor, path, state, cfg);

    // 2. visit children
    children && visitEnterAll(children, path, state);
  }
  else {
    // <- Exit

    // 1. visit children
    children && visitExitAll(children, path, state);

    // 2. instrument self
    shouldVisit && instrumentPath(direction, instrumentor, path, state, cfg);
  }
}

function getInstrumentor(instrumentors, instrumentationType) {
  // NOTE: a TraceType might not have an instrumentor both on `Enter` as well as `Exit`
  const instrumentationTypeName = TraceInstrumentationType.nameFromForce(instrumentationType);
  // if (!instrumentors[traceTypeName]) {
  //   err('instrumentors are missing TraceType:', traceTypeName);
  // }
  const instrumentor = instrumentors[instrumentationTypeName];
  if (instrumentor && !(instrumentor instanceof Function)) {
    logError('instrumentor is not a function:', instrumentationTypeName, '-', instrumentor);
    return null;
  }
  return instrumentor;
}

function instrumentPath(direction, instrumentor, path, state, cfg) {
  // log
  Verbose && logInst('II', cfg, path, direction);

  // actual instrumentation
  const { extraCfg } = cfg;
  if (extraCfg?.array) {
    // path is an array?
    for (const p of path) {
      // const originalPath =
      instrumentor(p, state);
    }
  }
  else {
    // const originalPath = 
    instrumentor(path, state);
  }

  // TODO: remember originalPath for further processing?
  // if (originalPath) {
  //   path = originalPath;
  // }
}

function visitEnter(path, state, visitorCfg) {
  return visit(InstrumentationDirection.Enter, state.onTrace.bind(state), enterInstrumentors, path, state, visitorCfg);
}
function visitExit(path, state, visitorCfg) {
  return visit(InstrumentationDirection.Exit, state.onTraceExit.bind(state), exitInstrumentors, path, state, visitorCfg);
}


// ###########################################################################
// utilities
// ###########################################################################

// function err(message, obj) {
//   throw new Error(message + (obj && (' - ' + JSON.stringify(obj)) || ''));
// }



function _getFullName(cfg) {
  const { parentCfg,
    // instrumentationType,
    visitorName
  } = cfg;
  // const baseInstrumentationType = parentCfg?.instrumentationType || instrumentationType;
  // const baseName = TraceInstrumentationType.nameFromForce(baseInstrumentationType);
  if (parentCfg) {
    return `${_getFullName(parentCfg)}.${visitorName}`;
  }
  return visitorName;
}

function logInst(tag, cfg, path, direction = null, ...other) {
  const nodeName = getNodeNames(path.node)?.name;
  const cfgName = _getFullName(cfg);
  const dirIndicator = direction && direction === InstrumentationDirection.Enter ? ' ->' : ' <-';
  console.debug(
    `[${tag}]${dirIndicator || ''}`,
    `${cfgName}:`,
    nodeName && `${path.node.type} ${nodeName}` || truncate(path.toString().replace(/\n/g, ' '), { length: 100 }),
    // TraceInstrumentationType.nameFromForce(instrumentationType),
    ...other
  );
}

// ###########################################################################
// buildTraceVisitors
// ###########################################################################

let _cfg;
export function buildTraceVisitors() {
  const visitors = {};
  if (!_cfg) {
    _cfg = normalizeConfig(traceCfg);
  }

  for (const visitorName in _cfg) {
    const visitorCfg = _cfg[visitorName];
    visitors[visitorName] = {
      enter(path, state) {
        // if (path.getData()) {
        //   visit(state.onTrace.bind(state), enterInstrumentors, path, state, visitorCfg)
        // }
        visitEnter(path, state, visitorCfg);
      },

      exit(path, state) {
        visitExit(path, state, visitorCfg);
      }
    };
  }
  return visitors;
}