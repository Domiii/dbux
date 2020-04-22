/**
 * @file
 * 
 * NOTE: This file was originally designed to handle traces only.
 *  Later on we encountered some real issues from trying to separate trace and context instrumentation, and did not 
 *  have the time yet to properly separate them again. That is why there is also some context instrumentation in this file
 */

import Enum from 'dbux-common/src/util/Enum';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import { traceWrapExpression, traceBeforeExpression, buildTraceNoValue, traceCallExpression, traceSuper } from '../helpers/traceHelpers';
import { loopVisitor } from './loopVisitors';
import { getPathTraceId } from '../data/StaticTraceCollection';
import { isCallPath } from '../helpers/functionHelpers';
import functionVisitor from './functionVisitor';
import awaitVisitor from './awaitVisitor';

const TraceInstrumentationType = new Enum({
  NoTrace: 0,
  CallExpression: 1,
  /**
   * Result of a computation
   */
  ExpressionResult: 2,
  /**
   * Only keeping track of data
   */
  ExpressionValue: 3,
  // ExpressionNoValue: 3,
  Statement: 4,
  Block: 5,
  Loop: 6,

  // Special attention required for these
  MemberExpression: 8,
  Super: 9,
  ReturnArgument: 10,
  ThrowArgument: 11,

  Function: 12,
  Await: 13
});

const InstrumentationDirection = {
  Enter: 1,
  Exit: 2
};

const traceCfg = (() => {
  const {
    NoTrace,
    CallExpression,
    ExpressionResult,
    ExpressionValue,
    // ExpressionNoValue,
    Statement,
    Block,
    Loop,
    LoopBlock,

    MemberExpression,
    Super,
    ReturnArgument,
    ThrowArgument,

    Function,
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
    ClassPrivateProperty: [
      NoTrace,
      [['value', ExpressionResult]]
    ],
    ClassProperty: [
      NoTrace,
      [['value', ExpressionResult]]
    ],
    VariableDeclaration: [
      NoTrace,
      null,
      {
        // filter(path, state) {
        //   // ignore variable declarations in for loops inits
        //   return !path.parentPath.isFor();
        // }
      }
    ],
    VariableDeclarator: [
      NoTrace,
      [['init', ExpressionResult, null, { originalIsParent: true }]]
    ],


    // ########################################
    // expressions
    // ########################################
    CallExpression: [
      CallExpression
    ],
    OptionalCallExpression: [
      CallExpression
    ],
    NewExpression: [
      // TODO: fix this
      ExpressionResult
    ],
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
      MemberExpression
    ],

    OptionalMemberExpression: [
      MemberExpression
    ],

    SequenceExpression: [
      NoTrace,
      [['expressions', ExpressionValue]]
    ],

    TemplateLiteral: [
      NoTrace,
      [['expressions', ExpressionValue]]
    ],

    UnaryExpression: [
      NoTrace,
      [['argument', ExpressionValue]]
    ],

    Super: [
      Super
    ],

    // TODO: ParenthesizedExpression - https://github.com/babel/babel/blob/master/packages/babel-generator/src/generators/expressions.js#L27
    // TODO: BindExpression - https://github.com/babel/babel/blob/master/packages/babel-generator/src/generators/expressions.js#L224
    // TODO: TypeCastExpression
    // TODO: TupleExpression - https://github.com/babel/babel/blob/f6c7bf36cec81baaba8c37e572985bb59ca334b1/packages/babel-generator/src/generators/types.js#L139


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
      // TODO: make sure ReturnArgument executes, if there is no argument
      NoTrace,
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

    // ExpressionStatement: [['expression', true]], // already taken care of by everything else

    // ########################################
    // functions
    // ########################################
    Function: [
      Function
    ],

    // ########################################
    // await
    // ########################################
    AwaitExpression: [
      Await
    ],
  };
})();


// ###########################################################################
// utilities
// ###########################################################################

function err(message, obj) {
  throw new Error(message + (obj && (' - ' + JSON.stringify(obj)) || ''));
}

function validateCfgNode(node) {
  const [traceType, children, nodeCfg] = node;

  // make sure, it has a valid type
  TraceInstrumentationType.nameFromForce(traceType);
}

function validateCfg(cfg) {
  for (const name in cfg) {
    const nodeCfg = cfg[name];
    validateCfgNode(nodeCfg);
    // const [traceType, children, extraCfg] = nodeCfg;
    // for (const child of children) {
    //   ...
    // }
  }
}

function normalizeConfig(cfg) {
  for (const visitorName in cfg) {
    let nodeCfg = cfg[visitorName];
    if (!Array.isArray(nodeCfg)) {
      // no children
      nodeCfg = [nodeCfg];
    }

    const [traceType, children, extraCfg] = nodeCfg;
    if (extraCfg?.include) {
      // convert to set
      extraCfg.include = new Set(extraCfg.include);
    }
    // if (children) {
    //   children = Object.fromEntries(children.map(
    //     ([childName, ...childCfg]) => ([childName, childCfg])
    //   ));
    // }
    nodeCfg = [traceType, children, extraCfg];

    cfg[visitorName] = nodeCfg;
  }

  validateCfg(cfg);

  return cfg;
}

// ###########################################################################
// instrumentation recipes by node type
// ###########################################################################

function wrapExpression(traceType, path, state, cfg) {
  if (isCallPath(path)) {
    // some of the ExpressionResult + ExpressionValue nodes we are interested in, might also be call expressions
    return wrapCallExpression(path, state, traceType, cfg);
  }

  // any other expression with a result
  const originalIsParent = cfg?.originalIsParent;
  let tracePath;
  if (originalIsParent) {
    // we want to highlight the parentPath, instead of just the value path
    tracePath = path.parentPath;
  }

  return traceWrapExpression(traceType, path, state, tracePath);
}

function wrapCallExpression(path, state, callResultType, cfg) {
  // CallExpression

  // trace BeforeCallExpression (returns `originalPath`)
  path = traceBeforeExpression(TraceType.BeforeCallExpression, path, state, null);

  // special treatment for `super`
  const calleePath = path.get('callee');
  if (calleePath.isSuper()) {
    traceSuper(calleePath, state);
  }

  // trace CallResult
  path.setData('callResultType', callResultType);
  return path;
}

const enterInstrumentors = {
  CallExpression(path, state, cfg) {
    return wrapCallExpression(path, state, TraceType.CallExpressionResult, cfg);
  },
  ExpressionResult(path, state, cfg) {
    return wrapExpression(TraceType.ExpressionResult, path, state, cfg);
  },
  ExpressionValue(pathOrPaths, state, cfg) {
    if (Array.isArray(pathOrPaths)) {
      // e.g. `SequenceExpression` + 
      for (const path of pathOrPaths) {
        wrapExpression(TraceType.ExpressionValue, path, state, cfg);
      }
      return null;  // get originalPaths is currently meanignless since `path.get` would not work on it
    }
    else {
      return wrapExpression(TraceType.ExpressionValue, pathOrPaths, state, cfg);
    }
  },
  // ExpressionNoValue(path, state) {
  //   traceBeforeExpression(path, state);
  // },
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
  MemberExpression(path, state) {
    // trace object of method call
    if (path.node.computed) {
      // if `computed`, also trace property independently
      const propertyPath = path.get('property');
      wrapExpression(TraceType.ExpressionValue, propertyPath, state);
    }

    const objPath = path.get('object');
    if (objPath.isSuper()) {
      // super needs special treatment
      return traceSuper(objPath, state);
    }
    else {
      // trace object (e.g. `x` in `x.y`) as-is
      wrapExpression(TraceType.ExpressionValue, objPath, state, null, false);

      // NOTE: the `originalPath` is not maintained
      return undefined;
    }
  },
  Super(path, state) {
    // NOTE: for some reason, this visitor does not get picked up by Babel
  },

  ReturnArgument(path, state, cfg) {
    if (path.node) {
      // trace `arg` in `return arg;`
      return wrapExpression(TraceType.ReturnArgument, path, state, cfg);
    }
    else {
      // insert trace before `return;` statement
      return traceBeforeExpression(TraceType.ReturnNoArgument, path.parentPath, state, cfg);
    }
  },

  ThrowArgument(path, state, cfg) {
    return wrapExpression(TraceType.ThrowArgument, path, state, cfg);
  }
};


// ###########################################################################
// exitInstrumentors
// WARNING: The DFS nature of AST traversal means that `exit` instrumentors are 
//          traversed in opposite order (inner exits before outer).
// ###########################################################################

// function wrapExpressionExit(path, state, traceType) {
//   if (isCallPath(path)) {
//     return exitCallExpression(path, state, traceType);
//   }  
// }

function exitCallExpression(path, state) {
  // CallExpression
  // instrument args after everything else has already been done

  // const calleePath = path.get('callee');
  // const beforeCallTraceId = getPathTraceId(calleePath);
  // traceCallExpression(path, state, beforeCallTraceId);
  const beforeCallTraceId = getPathTraceId(path);
  const callResultType = path.getData('callResultType') || TraceType.CallExpressionResult;
  traceCallExpression(path, state, callResultType, beforeCallTraceId);
}

/**
 * NOTE: we have these specifically for expressions that
 * potentially can be `CallExpression`.
 */
const exitInstrumentors = {
  Function: functionVisitor,
  Await: awaitVisitor,

  CallExpression(path, state) {
    exitCallExpression(path, state);
  }
};

// ###########################################################################
// children
// ###########################################################################

const PendingVisitorsTag = '_pendingVisitors';

function pushChildVisitors(path, children) {
  if (!children) {
    return;
  }

  for (const child of children) {
    const [childName, ...childCfg] = child;
    const childPath = path.get(childName);

    if (childPath.node) {
      let pendingVisitors = childPath.getData(PendingVisitorsTag);
      if (!pendingVisitors) {
        childPath.setData(PendingVisitorsTag, pendingVisitors = []);
      }
      pendingVisitors.push(child);
    }
  }
}

function popVisitors(path, state) {
  const children = path.getData(PendingVisitorsTag);
  if (!children) {
    return;
  }

  for (const child of children) {
    const [childName, ...childCfg] = child;
    visitEnter(path, state, childCfg);
  }
}

// ###########################################################################
// visitors
// ###########################################################################

function visit(direction, onTrace, instrumentors, path, state, cfg) {
  const [instrumentationType, children, extraCfg] = cfg;
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

  // start tracing
  if (!onTrace(path)) return; // mark as visited

  // TODO: fix order:
  //  What is the order if you have children but also other nodes at the same time?
  //  children types are always:
  //    ExpressionValue, ExpressionResult, ReturnArgument, ThrowArgument, Block

  if (direction === InstrumentationDirection.Enter) {
    // TODO: popEnterVisitors

    // instrument this path
    instrumentPath(instrumentationType, instrumentors, path, state, extraCfg);

    // add children to visitor queue
    pushChildVisitors(path, children);
  }
  else {
    // instrument this path
    instrumentPath(instrumentationType, instrumentors, path, state, extraCfg);

    // TODO: popExitVisitors
  }
}

function instrumentPath(instrumentationType, instrumentors, path, state, cfg) {
  if (instrumentationType) {
    // 2. trace node itself
    const traceTypeName = TraceInstrumentationType.nameFromForce(instrumentationType);
    // if (!instrumentors[traceTypeName]) {
    //   err('instrumentors are missing TraceType:', traceTypeName);
    // }
    if (instrumentors[traceTypeName]) {
      const originalPath = instrumentors[traceTypeName](path, state, cfg);
      if (originalPath) {
        path = originalPath;
      }
    }
  }
}

function visitEnter(path, state, visitorCfg) {
  return visit(InstrumentationDirection.Enter, state.onTrace.bind(state), enterInstrumentors, path, state, visitorCfg);
}
function visitExit(path, state, visitorCfg) {
  return visit(InstrumentationDirection.Exit, state.onTraceExit.bind(state), exitInstrumentors, path, state, visitorCfg);
}

let _cfg;
export function buildAllTraceVisitors() {
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