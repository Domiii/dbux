import template from '@babel/template';
import Enum from 'dbux-common/src/util/Enum';
import * as t from '@babel/types';
import TraceType from 'dbux-common/src/core/constants/TraceType';
// TODO: want to do some extra work to better trace loops

const TraceInstrumentationType = new Enum({
  NoTrace: 0,
  ExpressionWithValue: 1,
  ExpressionNoValue: 2,
  Statement: 3,
  Block: 4
});

const traceCfg = (() => {
  const {
    NoTrace,
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
      Statement,
      null,
      {
        filter(path, state) {
          // ignore variable declarations in for loops inits
          return !path.parentPath.isFor();
        }
      }
    ],
    VariableDeclarator: [
      NoTrace,
      [['init', ExpressionWithValue]]
    ],


    // ########################################
    // expressions
    // ########################################
    AwaitExpression: [
      ExpressionWithValue,
      [['argument', ExpressionNoValue]]
    ],
    ConditionalExpression: [
      ExpressionWithValue,
      [['test', ExpressionWithValue], ['consequent', ExpressionWithValue], ['alternate', ExpressionWithValue]]
    ],
    CallExpression: [
      ExpressionWithValue,
      // [['arguments', true]] // TODO: must capture each individual argument
    ],
    OptionalCallExpression: [
      ExpressionWithValue,
      // [['arguments', true]] // TODO: must capture each individual argument
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
    ReturnStatement: Statement,
    ThrowStatement: Statement,

    
    // ########################################
    // loops
    // ########################################
    DoWhileLoop: [
      NoTrace,
      [['test', ExpressionWithValue], ['body', Block]]
    ],
    ForInStatement: [
      NoTrace,
      [['body', Block]]
    ],
    ForOfStatement: [
      NoTrace,
      [['body', Block]]
    ],
    ForStatement: [
      NoTrace,
      [['test', ExpressionWithValue], ['update', ExpressionWithValue], ['body', Block]]
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
// templates + instrumentation
// ###########################################################################

function replaceWithTemplate(templ, path, cfg) {
  const newNode = templ(cfg);
  path.replaceWith(newNode);
}

const buildTraceNoValue = function (templ, path, state, traceType) {
  const { ids: { dbux } } = state;
  const traceId = state.addTrace(path, traceType);
  return templ({
    dbux,
    traceId: t.numericLiteral(traceId)
  });
}.bind(null, template('%%dbux%%.t(%%traceId%%)'));


const traceWrapExpression = function (templ, expressionPath, state) {
  const {node} = expressionPath;
  if (t.isLiteral(node)) {
    // don't care about literals
    return;
  }
  const { ids: { dbux } } = state;
  const traceId = state.addTrace(expressionPath, TraceType.ExpressionResult);
  replaceWithTemplate(templ, expressionPath, {
    dbux,
    traceId: t.numericLiteral(traceId),
    expression: node
  });

  // prevent infinite loop
  state.onCopy(expressionPath, expressionPath.get('arguments.1'), 'trace');
  // state.onCopy(expressionPath, expressionPath.get('expressions.1.arguments.1'), 'trace');
// }.bind(null, template('%%dbux%%.t(%%traceId%%), %%dbux%%.tv(%%traceId%%, %%expression%%)'));
}.bind(null, template('%%dbux%%.tv(%%traceId%%, %%expression%%)'));


const traceBeforeExpression = function (templ, expressionPath, state) {
  const { ids: { dbux } } = state;
  const traceId = state.addTrace(expressionPath, TraceType.BeforeExpression);
  replaceWithTemplate(templ, expressionPath, {
    dbux,
    traceId: t.numericLiteral(traceId),
    expression: expressionPath.node
  });

  // prevent infinite loop
  state.onCopy(expressionPath, expressionPath.get('expressions.1'), 'trace');
}.bind(null, template('%%dbux%%.t(%%traceId%%), %%expression%%'))


// ###########################################################################
// instrumentation recipes by node type
// ###########################################################################

const instrumentors = {
  ExpressionWithValue(path, state) {
    traceWrapExpression(path, state);
  },
  ExpressionNoValue(path, state) {
    traceBeforeExpression(path, state);
  },
  Statement(path, state) {
    const trace = buildTraceNoValue(path, state, TraceType.Statement);
    path.insertBefore(trace);
  },
  Block(path, state) {
    const trace = buildTraceNoValue(path, state, TraceType.BlockStart);
    path.insertBefore(trace);
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
    // ignored
    return;
  }
  if (extraCfg?.filter && !extraCfg.filter(path, state, cfg)) {
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