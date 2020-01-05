import template from '@babel/template';
import Enum from 'dbux-common/src/util/Enum';
import * as t from '@babel/types';
// TODO: want to do some extra work to better trace loops

const TraceTypes = new Enum({
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
  } = TraceTypes;

  return {
    // assignments
    AssignmentExpression: [
      NoTrace,
      [['right', ExpressionWithValue]]
    ],
    ClassPrivateProperty: [
      NoTrace,
      [['value', ExpressionWithValue]]
    ],
    ClassProperty: [
      NoTrace,
      [['value', ExpressionWithValue]]
    ],
    VariableDeclarator: [
      NoTrace,
      [['init', ExpressionWithValue]]
    ],

    // expressions
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

    // statements
    BreakStatement: Statement,
    ContinueStatement: Statement,
    Decorator: [
      NoTrace,
      [['expression', ExpressionNoValue]]
    ],
    Declaration: [
      Statement,
      null, // no children
      {
        ignore: ['ImportDeclaration'] // ignore: cannot mess with imports
      }
    ],
    ReturnStatement: Statement,
    ThrowStatement: Statement,

    // loops
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

    // if, else, switch
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

    // try + catch
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
  TraceTypes.nameFromForce(traceType);
}

function validateCfg(cfg) {
  for (const name in cfg) {
    const node = cfg[name];
    validateCfgNode(node);
    const children = node.children || {};
    for (const child of children) {
      validateCfgNode(child);
    }
  }
}

function normalizeConfig() {
  for (const visitorName in traceCfg) {
    let nodeCfg = traceCfg[visitorName];
    if (!Array.isArray(nodeCfg)) {
      // no children
      nodeCfg = [nodeCfg];
    }

    const [traceType, children, extraCfg] = nodeCfg;
    if (extraCfg?.include) {
      // convert to set
      extraCfg.include = new Set(extraCfg.include);
    }
    
    traceCfg[visitorName] = nodeCfg;
  }

  return traceCfg;
}

// ###########################################################################
// templates + instrumentation recipes
// ###########################################################################

function replaceWithTemplate(templ, path, cfg) {
  const newNode = templ(cfg);
  path.replaceWith(newNode);
}

function buildRecipes(state) {
  const { ids: { dbux } } = state;

  const instrumentors = {

    buildTraceNoValue: function(templ, path) {
      const traceId = state.addTrace(path);
      return templ({ dbux, traceId });
    }.bind(state, template('%%dbux%%.t(%%traceId%%)')),

    traceWrapExpression: function (templ, expressionPath) {
      const traceId = state.addTrace(expressionPath);
      replaceWithTemplate(templ, expressionPath, {
        dbux,
        traceId,
        expression: expressionPath.node
      });

      // prevent infinite loop
      state.markVisited(expressionPath.get('arguments.1'));
    }.bind(state, template('%%dbux%%.t(%%traceId%%, %%expression%%)')),

    traceBeforeExpression: function (templ, expressionPath) {
      const trace = instrumentors.buildTraceNoValue(expressionPath);
      replaceWithTemplate(templ, expressionPath, {
        dbux,
        trace,
        expression: expressionPath.node
      });

      // prevent infinite loop
      state.markVisited(expressionPath.get('arguments.1'));
    }.bind(state, template('%%trace%%, %%expression%%'))

  };

  return instrumentors;
}

// ###########################################################################
// instrumentation
// ###########################################################################


function buildInstrumentors(state) {
  const recipes = buildRecipes(state);

  return {
    ExpressionWithValue(path) {
      // future work: maybe we want to insert trace before expression as well
      recipes.traceWrapExpression(path);
    },
    ExpressionNoValue(path) {
      recipes.traceBeforeExpression(path);
    },
    Statement(path) {
      const trace = recipes.buildTraceNoValue(path);
      path.insertBefore(trace);
    },
    Block(path) {
      const trace = recipes.buildTraceNoValue(path);
      path.insertBefore(trace);
      // if (!t.isBlockStatement(path)) {
      //   // make a new block

      // }
      // else {
      //   // insert at the top of existing block
      // }
    }
  };
}

// ###########################################################################
// visitors
// ###########################################################################

let instrumentors;

function visit(state, path, cfg) {
  if (!state.onTrace(path)) return;

  const [traceType, children, extraCfg] = cfg;
  if (extraCfg?.ignore?.has(path.node.type)) {
    // ignored
    return;
  }

  const traceTypeName = TraceTypes.nameFromForce(traceType);
  instrumentors[traceTypeName](path);

  if (!instrumentors[traceTypeName]) {
    err('instrumentors are missing TraceType:', traceTypeName);
  }

  for (const child of children) {
    const [childName, ...childCfg] = child;
    const childPath = path.get(childName);
    
    visit(state, childPath, childCfg);
  }
}

export function buildAllTraceVisitors(state) {
  const visitors = {};
  const cfg = normalizeConfig();
  validateCfg(cfg);
  
  instrumentors = buildInstrumentors(state);

  for (const visitorName in cfg) {
    visitors[visitorName] = (path) => {
      visit(state, path, cfg[visitorName]);
    };
  }
  return visitors;
}