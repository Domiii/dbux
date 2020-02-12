import template from '@babel/template';
import Enum from 'dbux-common/src/util/Enum';
import * as t from '@babel/types';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import { traceWrapExpression, traceBeforeExpression, buildTraceNoValue, traceWrapArg } from '../helpers/traceHelpers';
import { isPathInstrumented } from '../helpers/instrumentationHelper';
// TODO: want to do some extra work to better trace loops

const TraceInstrumentationType = new Enum({
  NoTrace: 0,
  CallExpression: 1,
  ExpressionWithValue: 2,
  ExpressionNoValue: 3,
  Statement: 4,
  Block: 5
});

const traceCfg = (() => {
  const {
    NoTrace,
    CallExpression,
    ExpressionWithValue,
    ExpressionNoValue,
    Statement,
    Block
  } = TraceInstrumentationType;

  return {
    // ########################################
    // assignments
    // ########################################
    AssignmentExpression: [
      ExpressionWithValue,
      // [['right', ExpressionWithValue]]
    ],
    ClassPrivateProperty: [
      NoTrace,
      [['value', ExpressionWithValue]]
    ],
    ClassProperty: [
      NoTrace,
      [['value', ExpressionWithValue]]
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
      [['init', ExpressionWithValue]]
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
      CallExpression
    ],
    AwaitExpression: [
      ExpressionWithValue
      // [['argument', ExpressionNoValue]]
    ],
    ConditionalExpression: [
      ExpressionWithValue,
      [['test', ExpressionWithValue], ['consequent', ExpressionWithValue], ['alternate', ExpressionWithValue]]
    ],
    Super: ExpressionNoValue,
    UpdateExpression: ExpressionWithValue,
    YieldExpression: [
      NoTrace,
      [['argument', ExpressionWithValue]]
    ],


    // ########################################
    // statements
    // ########################################
    BreakStatement: Statement,
    ContinueStatement: Statement,
    Decorator: [
      NoTrace,
      [['expression', ExpressionNoValue]]
    ],
    // Declaration: [
    //   Statement,
    //   null, // no children
    //   {
    //     ignore: ['ImportDeclaration'] // ignore: cannot mess with imports
    //   }
    // ],
    ReturnStatement: [
      NoTrace,
      [['argument', ExpressionWithValue]]
    ],
    ThrowStatement: Statement,


    // ########################################
    // loops
    // ########################################
    ForStatement: [
      NoTrace,
      [['test', ExpressionWithValue], ['update', ExpressionWithValue], ['body', Block]]
    ],
    ForInStatement: [
      // TODO: trace `left` value
      NoTrace,
      [['body', Block]]
    ],
    ForOfStatement: [
      // TODO: trace `left` value
      NoTrace,
      [['body', Block]]
    ],
    DoWhileLoop: [
      // TODO: currently disabled because babel doesn't like it; probably a babel bug?
      NoTrace,
      [['test', ExpressionWithValue], ['body', Block]]
    ],
    WhileStatement: [
      NoTrace,
      [['test', ExpressionWithValue], ['body', Block]]
    ],

    // ########################################
    // if, else, switch, case
    // ########################################
    IfStatement: [
      NoTrace,
      [['test', ExpressionWithValue], ['consequent', Block], ['alternate', Block]],
    ],
    SwitchStatement: [
      NoTrace,
      [['discriminant', ExpressionWithValue]]
    ],
    // SwitchCase: [
    // TODO: insert trace call into `consequent` array.
    //    NOTE: we cannot just block the `consequent` array as that will change the semantics (specifically: local variables cannot spill into subsequent cases anymore)
    //   NoTrace,
    //   [['consequent']]
    // ],


    // ########################################
    // try + catch
    // ########################################
    TryStatement: [
      NoTrace,
      [['block', Block], ['finalizer', Block]]
    ],
    CatchClause: [
      NoTrace,
      [['body', Block]]
    ],

    // ExpressionStatement: [['expression', true]], // already taken care of by everything else

  };
})();

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


function instrumentArgs(callPath, state) {
  const args = callPath.node.arguments;
  const replacements = [];
  for (let i = 0; i < args.length; ++i) {
    // if (t.isFunction(args[i])) {
    //   replacements.push(() => instrumentCallbackSchedulingArg(callPath, state, i));
    // }
    // else {
    const argPath = callPath.get('arguments.' + i);
    if (!isPathInstrumented(argPath)) {
      /**
       * Only instrument if not already instrumented.
       * Affected Example: `f(await g())` (`await g()` is already instrumented by `awaitVisitor`)
       */
      replacements.push(() => traceWrapArg(argPath, state));
    }
    // }
  }

  // TODO: I forgot why I deferred all calls to here? 
  //    Probably had the order flipped before or did nested replacements;
  //    might not need to defer anymore.
  replacements.forEach(r => r());
}

const instrumentors = {
  CallExpression(path, state) {
    instrumentArgs(path, state);
    traceWrapExpression(path, state);
  },
  ExpressionWithValue(path, state) {
    traceWrapExpression(path, state);
  },
  ExpressionNoValue(path, state) {
    traceBeforeExpression(path, state);
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
  }
};

// ###########################################################################
// visitors
// ###########################################################################

function enter(path, state, cfg) {
  if (!state.onTrace(path)) return;

  const [traceType, children, extraCfg] = cfg;
  if (extraCfg?.ignore?.includes(path.node.type)) {
    // ignore (array of type name)
    return;
  }
  if (extraCfg?.filter && !extraCfg.filter(path, state, cfg)) {
    // filter (custom function)
    return;
  }

  const traceTypeName = TraceInstrumentationType.nameFromForce(traceType);
  if (traceType) {
    if (!instrumentors[traceTypeName]) {
      err('instrumentors are missing TraceType:', traceTypeName);
    }
    instrumentors[traceTypeName](path, state, extraCfg);
  }

  if (children) {
    for (const child of children) {
      const [childName, ...childCfg] = child;
      const childPath = path.get(childName);

      if (childPath.node) {
        enter(childPath, state, childCfg);
      }
    }
  }
}

let _cfg;
export function buildAllTraceVisitors() {
  const visitors = {};
  if (!_cfg) {
    _cfg = normalizeConfig(traceCfg);
  }

  for (const visitorName in _cfg) {
    visitors[visitorName] = {
      enter(path, state) {
        enter(path, state, _cfg[visitorName]);
      }
    };
  }
  return visitors;
}