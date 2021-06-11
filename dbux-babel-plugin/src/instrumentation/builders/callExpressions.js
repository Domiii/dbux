import template from '@babel/template';
import { NodePath } from '@babel/traverse';
// import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import TraceCfg from '../../definitions/TraceCfg';
import { makeInputs, NullNode, ZeroNode } from './buildHelpers';
import { buildArrayArgsNoSpread, buildGetI } from './common';
import { buildTraceExpressionNoInput, buildTraceId } from './misc';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('builders/callExpressions');


// /**
//  * NOTE: the name chosen here will show up in error messages
//  */
// function generateCalleeVar(calleePath) {
//   const id = calleePath.scope.generateUidIdentifierBasedOnNode(calleePath.node);
//   calleePath.scope.push({
//     id
//   });
//   return id;
//   // return calleePath.node.name || 'func';
// }

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

function buildCallNodeDefault(path, calleeVar, argsVar, argNodes) {
  const { type } = path.node;
  const callTempl = callTemplatesDefault[type];
  return callTempl({
    callee: calleeVar,
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
  const callTempl = callTemplatesME[type]();
  return callTempl({
    callee: calleeVar,
    o: objectVar,
    args: buildCallArgs(argsVar, argNodes)
  }).expression;
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

  const args = buildArrayArgsNoSpread(argPaths);
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
// buildTraceCallME
// ###########################################################################

/**
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
      calleeTrace: {
        // NOTE: callee was built (but not replaced) by MemberExpression
        resultNode: calleeAstNode
      }
    }
  } = traceCfg;

  const calleePath = path.get('callee');
  // NOTE: `object` is instrumented by ME adding it as `input`
  const objectPath = calleePath.get('object');
  const argPaths = path.get('arguments');

  const argsVar = generateVar(scope, 'args');

  const args = buildArrayArgsNoSpread(argPaths);
  const argNodes = argPaths?.map(a => a.node) || EmptyArray;
  const spreadArgs = buildSpreadArgs(argsVar, argNodes);

  // hackfix: override targetNode during instrumentation
  traceCfg.meta.targetNode = buildCallNodeME(path, objectVar, calleeVar, argsVar, argNodes);
  // debug(`tcr target: ${astNodeToString(getInstrumentTargetNode(traceCfg))}`);

  return t.sequenceExpression([
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
  ]);
}

// export const buildTraceCallArgument = buildTraceCall(
//   '%%traceCallArgument%%(%%expr%%, %%tid%%, %%declarationTid%%, %%calleeTid%%, %%inputs%%)',
//   function buildTraceCallArgument(state, traceCfg) {
//     const { ids: { aliases: {
//       traceCallArgument
//     } } } = state;

//     const {
//       declarationTidIdentifier,
//       inputTraces,
//       calleeTid
//     } = traceCfg;

//     const tid = buildTraceId(state, traceCfg);

//     const declarationTid = declarationTidIdentifier || ZeroNode;

//     return {
//       expr,
//       traceCallArgument,
//       tid,
//       declarationTid,
//       inputs: makeInputs(inputTraces),
//       calleeTid
//     };
//   }
// );

