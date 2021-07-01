import template from '@babel/template';
import { NodePath } from '@babel/traverse';
// import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
// import { newLogger } from '@dbux/common/src/log/logger';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import TraceCfg from '../../definitions/TraceCfg';
import { makeInputs, NullNode } from './buildUtil';
import { buildTraceId } from './traceId';
import { buildSpreadableArgArrayNoSpread, buildGetI } from './arrays';
import { buildTraceExpressionNoInput } from './misc';


// // eslint-disable-next-line no-unused-vars
// const { log, debug, warn, error: logError } = newLogger('builders/callExpressions');

/**
 * @param {NodePath} path
 */
function generateVar(scope, name) {
  return scope.generateDeclaredUidIdentifier(name);
  // return calleePath.node.name || 'func';
}


// ###########################################################################
// arguments
// ###########################################################################

function buildSpreadArgs(argsVar, argNodes) {
  // const { ids: { aliases: {
  //   getArgLength
  // } } } = state;
  return t.arrayExpression(argNodes
    .map((argNode, i) => t.isSpreadElement(argNode) ?
      // t.callExpression(
      //   getArgLength,
      buildGetI(argsVar, i) :
      // ) :
      NullNode
    )
    .filter(n => !!n)
  );
}

/**
 * Build call arguments as array of Nodes, spread elements as necessary.
 * @example `[argsVar[0], ...argsVar[1], ...argsVar[2], argsVar[3]]`
 */
function buildCallArgs(argsVar, argNodes) {
  return argNodes.map((argNode, i) => {
    const arg = buildGetI(argsVar, i);
    return t.isSpreadElement(argNode) ?
      t.spreadElement(arg) :
      arg;
  });
}

// ###########################################################################
// BCE
// ###########################################################################

/**
 * @param {DbuxState} state 
 * @param {TraceCfg} traceCfg 
 */
function buildBCE(state, traceCfg, spreadArgs) {
  const { ids: { aliases: {
    traceBCE
  } } } = state;

  const tid = buildTraceId(state, traceCfg);
  const argTids = makeInputs(traceCfg);

  return t.callExpression(traceBCE, [
    tid,
    argTids,
    spreadArgs
  ]);
}


// ###########################################################################
// CallExpression templates (default)
// ###########################################################################


/**
 * Default CallExpression templates.
 */
const callTemplatesDefault = {
  CallExpression: template(`
    %%callee%%(%%args%%)
  `),

  /**
   * @see https://github.com/babel/babel/blob/master/packages/babel-plugin-proposal-optional-chaining/src/index.js
   */
  OptionalCallExpression: template(`
    %%callee%%?.(%%args%%)
  `),

  NewExpression: template(`
    new %%callee%%(%%args%%)
  `)
};

function buildCallNodeDefault(path, callee, argsVar, argNodes) {
  const { type } = path.node;
  const callTempl = callTemplatesDefault[type];
  return callTempl({
    callee,
    args: buildCallArgs(argsVar, argNodes)
  }).expression;
}


// ###########################################################################
// CallExpression templates (ME)
// ###########################################################################

/**
 * Call templates if callee is MemberExpression.
 * NOTE: the call templates do not have arguments. We will put them in manually, so as to avoid loss of path data.
 * NOTE: the `null` expression (i.e. `newPath.get('expressions.2')`) is a placeholder for BCE id.
 */
const callTemplatesME = {
  // NOTE: `f.call.call(f, args)` also works 
  //        i.e. `f.call(this, 1);`
  //          -> `f.call.call(f, this, 1))`
  CallExpression: () => template(`
    %%callee%%.call(%%o%%, %%args%%)
  `),

  /**
   * @see https://github.com/babel/babel/blob/master/packages/babel-plugin-proposal-optional-chaining/src/index.js
   */
  OptionalCallExpression: () => template(`
    %%callee%%?.call(%%o%%, %%args%%)
  `),

  NewExpression: () => template(`
    new %%callee%%(%%args%%)
`)
};

function buildCallNodeME(path, objectVar, calleeVar, argsVar, argNodes) {
  const { type } = path.node;
  const callTemplate = callTemplatesME[type]();

  const templateArgs = {
    callee: calleeVar,
    args: buildCallArgs(argsVar, argNodes)
  };

  // future-work: no need to trace `o` separately for `NewExpression`
  if (type !== 'NewExpression') {
    templateArgs.o = objectVar;
  }

  return callTemplate(templateArgs).expression;
}


// ###########################################################################
// buildTraceCallDefault
// ###########################################################################

/**
 * @param {TraceCfg} traceCfg 
 * @returns 
 */
export function buildTraceCallDefault(state, traceCfg) {
  const {
    path,
    path: { scope },
    data: {
      bceTrace,
      calleeVar
    }
  } = traceCfg;

  const calleePath = path.get('callee');
  const argPaths = path.get('arguments');
  // const calleeVar = generateVar(scope, 'f'); // generateCalleeVar(calleePath);
  const argsVar = generateVar(scope, 'args');

  const args = buildSpreadableArgArrayNoSpread(argPaths);
  const argNodes = argPaths?.map(a => a.node) || EmptyArray;
  const spreadArgs = buildSpreadArgs(argsVar, argNodes);

  // hackfix: override targetNode during instrumentation
  traceCfg.meta.targetNode = buildCallNodeDefault(path, calleeVar, argsVar, argNodes);

  return t.sequenceExpression([
    // (i) callee assignment - `f = ...`
    t.assignmentExpression('=', calleeVar, calleePath.node),

    // (ii) args assignment - `args = [...]`
    t.assignmentExpression('=', argsVar, args),

    // (iii) BCE - `bce(tid, argTids, spreadArgs)`
    buildBCE(state, bceTrace, spreadArgs),

    // (iv) wrap actual call - `tcr(f(args[0], ...args[1], args[2]))`
    buildTraceExpressionNoInput(
      // NOTE: targets `traceCfg.meta.targetNode`
      state,
      traceCfg
    )
  ]);
}


// ###########################################################################
// buildTraceCallFixCallee
// ###########################################################################


/**
 * Special callees that cannot be re-written.
 * E.g. `eval`, `require`, `super` etc.
 * 
 * @param {TraceCfg} traceCfg 
 * @returns 
 */
export function buildTraceCallUntraceableCallee(state, traceCfg) {
  const {
    path,
    path: { scope },
    data: {
      bceTrace
    }
  } = traceCfg;

  const calleePath = path.get('callee');
  const argPaths = path.get('arguments');
  const argsVar = generateVar(scope, 'args');

  const args = buildSpreadableArgArrayNoSpread(argPaths);
  const argNodes = argPaths?.map(a => a.node) || EmptyArray;
  const spreadArgs = buildSpreadArgs(argsVar, argNodes);

  // hackfix: override targetNode during instrumentation
  traceCfg.meta.targetNode = buildCallNodeDefault(path, calleePath.node, argsVar, argNodes);

  return t.sequenceExpression([
    // (i) args assignment - `args = [...]`
    t.assignmentExpression('=', argsVar, args),

    // (ii) BCE - `bce(tid, argTids, spreadArgs)`
    buildBCE(state, bceTrace, spreadArgs),

    // (iii) wrap actual call - `tcr(f(args[0], ...args[1], args[2]))`
    buildTraceExpressionNoInput(
      // NOTE: targets `traceCfg.meta.targetNode`
      state,
      traceCfg
    )
  ]);
}


// ###########################################################################
// buildTraceCallME
// ###########################################################################

/**
 * [ME]
 * 
 * In: `obj.fun()`
 * Out: `(o=obj, f=o.fun, args=[...], BCE, callTemplate(o, f, args))`
 * 
 * In: `obj.fun().gun()`
 * Out: `(
 *   o2=(o=obj, f=o.fun, args=[...], BCE, callTemplate(o, f, args),
 *   f2=o2.gun,
 *   args2=[...],
 *   BCE2,
 *   callTemplate(o2, f2, args2)
 * )`
 * 
 * @param {TraceCfg} traceCfg 
 * @returns 
 */
export function buildTraceCallME(state, traceCfg) {
  const {
    path,
    path: { scope },
    data: {
      bceTrace,
      calleeVar,
      objectVar,
      // objectPath,
      calleeTrace: {
        // NOTE: callee was built (but not replaced) by MemberExpression
        resultNode: calleeAstNode
      }
    }
  } = traceCfg;

  const calleePath = path.get('callee');
  const objectPath = calleePath.get('object');
  const argPaths = path.get('arguments');

  const argsVar = generateVar(scope, 'args');

  const args = buildSpreadableArgArrayNoSpread(argPaths);
  const argNodes = argPaths?.map(a => a.node) || EmptyArray;
  const spreadArgs = buildSpreadArgs(argsVar, argNodes);

  // hackfix: override targetNode during instrumentation
  traceCfg.meta.targetNode = buildCallNodeME(path, objectVar, calleeVar, argsVar, argNodes);
  // debug(`tcr target: ${astNodeToString(getInstrumentTargetNode(traceCfg))}`);

  const expressions = [];

  expressions.push(
    // (i) object assignment - `o = ...`
    t.assignmentExpression('=', objectVar, objectPath.node),

    // (ii) callee assignment - `f = ...`
    t.assignmentExpression('=', calleeVar, calleeAstNode),

    // (iii) args assignment - `args = [...]`
    t.assignmentExpression('=', argsVar, args),

    // (iv) BCE - `bce(tid, argTids, spreadArgs)`
    buildBCE(state, bceTrace, spreadArgs),

    // (v) wrap actual call - `tcr(f.call(o, args[0], ...args[1], args[2]))`
    buildTraceExpressionNoInput(
      // NOTE: targets `traceCfg.meta.targetNode`
      state,
      traceCfg
    )
  );

  return t.sequenceExpression(expressions);
}
