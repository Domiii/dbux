/**
 * @file
 * 
 * NOTE: This file was originally designed to handle traces only.
 *  Later on we encountered some real issues from trying to separate trace and context instrumentation, and did not 
 *  have the time yet to properly separate them again. That is why there is also some context instrumentation in this file
 */

import template from '@babel/template';
import Enum from 'dbux-common/src/util/Enum';
import * as t from '@babel/types';
import TraceType from 'dbux-common/src/core/constants/TraceType';
import { traceWrapExpression, traceBeforeExpression, buildTraceNoValue, traceWrapArg, traceCallExpression, traceValueBeforeExpression } from '../helpers/traceHelpers';
import { instrumentLoop } from './loopVisitors';
import { getPathTraceId } from '../data/StaticTraceCollection';
import { getAllButRightMostPath } from '../helpers/objectHelpers';
// TODO: want to do some extra work to better trace loops

const TraceInstrumentationType = new Enum({
  NoTrace: 0,
  // CallExpression: 1,
  /**
   * Result of a computation
   */
  ExpressionResult: 2,
  /**
   * Only keeping track of data
   */
  ExpressionValue: 3,
  ExpressionNoValue: 3,
  Statement: 4,
  Block: 5,
  Loop: 6,
  LoopBlock: 7,

  MemberExpression: 8
});

const traceCfg = (() => {
  const {
    NoTrace,
    // CallExpression,
    ExpressionValue,
    ExpressionResult,
    // ExpressionNoValue,
    Statement,
    Block,
    Loop,
    LoopBlock,
    MemberExpression
  } = TraceInstrumentationType;

  return {
    // ########################################
    // assignments
    // ########################################
    AssignmentExpression: [
      ExpressionResult,
      // [['right', ExpressionResult]]
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
      ExpressionResult
    ],
    OptionalCallExpression: [
      ExpressionResult
    ],
    NewExpression: [
      ExpressionResult
    ],
    AwaitExpression: [
      NoTrace // WARNING: don't change this - will cause await to bug out, due to a conflict with `awaitVisitor`'s instrumentation
      // ExpressionResult
      // [['argument', ExpressionNoValue]]
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
      [['left', ExpressionResult], ['right', ExpressionResult]]
    ],

    MemberExpression: [
      // TODO: if `computed`, also need to trace property
      MemberExpression,
      [['object', ExpressionValue]]
    ],

    OptionalMemberExpression: [
      MemberExpression,
      [['object', ExpressionValue]]
    ],

    SequenceExpression: [
      NoTrace,
      [['expressions', ExpressionValue]]
    ],

    Super: NoTrace,   // NOTE: is handled separately, in `CallExpression` and `MemberExpression`

    TemplateLiteral: [
      NoTrace,
      [['expressions', ExpressionValue]]
    ],

    UnaryExpression: [
      NoTrace,
      [['argument', ExpressionValue]]
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
      NoTrace,
      [['argument', ExpressionResult]]
    ],
    ThrowStatement: Statement,


    // ########################################
    // loops
    // ########################################
    ForStatement: [
      Loop,
      [['test', ExpressionResult], ['update', ExpressionResult], ['body', LoopBlock]]
    ],
    ForInStatement: [
      Loop,
      [['body', LoopBlock]]
    ],
    ForOfStatement: [
      Loop,
      [['body', LoopBlock]]
    ],
    DoWhileLoop: [
      // TODO: currently disabled because babel doesn't like it; probably a babel bug?
      Loop,
      [['test', ExpressionResult], ['body', LoopBlock]]
    ],
    WhileStatement: [
      Loop,
      [['test', ExpressionResult], ['body', LoopBlock]]
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

const enterInstrumentors = {
  ExpressionResult(path, state, cfg) {
    if (path.isCallExpression() || path.isOptionalCallExpression()) {
      // CallExpression

      // object method calls
      const calleePath = path.get('callee');
      
      // TODO: optional chaining

      if (calleePath.isSuper()) {
        // TODO
      }
      else if (calleePath.isMemberExpression()) {
        // trace object of method call
        const objPath = calleePath.get('object');
        if (objPath.isSuper()) {
          // cannot wrap `super` -> trace `this` before expression instead (NOTE: returns original path)
          path = traceValueBeforeExpression(path, state, TraceType.CalleeObject, objPath, 'this');
        }
        else {
          // wrap object as-is
          traceWrapExpression(TraceType.CalleeObject, objPath, state);
        }
      }

      // trace before call (returns original path)
      path = traceBeforeExpression(path, state, TraceType.BeforeCallExpression, null);
    }
    else {
      // any other expression with a result
      const originalIsParent = cfg?.originalIsParent;
      let tracePath;
      if (originalIsParent) {
        // we want to highlight the parentPath, instead of just the value path
        tracePath = path.parentPath;
      }

      traceWrapExpression(TraceType.ExpressionResult, path, state, tracePath);
    }
  },
  ExpressionValue(path, state) {
    // TODO
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
    instrumentLoop(path, state);
  },
  LoopBlock(path, state) {
  },
  MemberExpression(path, state) {
    // TODO
  }
};

const exitInstrumentors = {
  ExpressionResult(path, state) {
    if (path.isCallExpression() || path.isOptionalCallExpression()) {
      // CallExpression
      // instrument args after everything else has already been done
      // const calleePath = path.get('callee');
      // const beforeCallTraceId = getPathTraceId(calleePath);
      // traceCallExpression(path, state, beforeCallTraceId);
      const beforeCallTraceId = getPathTraceId(path);
      traceCallExpression(path, state, beforeCallTraceId);
    }
  }
};

// ###########################################################################
// visitors
// ###########################################################################

function visit(onTrace, instrumentors, path, state, cfg) {
  if (!onTrace(path)) return;

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
    // if (!instrumentors[traceTypeName]) {
    //   err('instrumentors are missing TraceType:', traceTypeName);
    // }
    if (instrumentors[traceTypeName]) {
      instrumentors[traceTypeName](path, state, extraCfg);
    }
  }

  if (children) {
    for (const child of children) {
      const [childName, ...childCfg] = child;
      const childPath = path.get(childName);

      if (childPath.node) {
        visit(onTrace, instrumentors, childPath, state, childCfg);
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
    const visitorCfg = _cfg[visitorName];
    visitors[visitorName] = {
      enter(path, state) {
        visit(state.onTrace.bind(state), enterInstrumentors, path, state, visitorCfg);
      },

      exit(path, state) {
        visit(state.onTraceExit.bind(state), exitInstrumentors, path, state, visitorCfg);
      }
    };
  }
  return visitors;
}