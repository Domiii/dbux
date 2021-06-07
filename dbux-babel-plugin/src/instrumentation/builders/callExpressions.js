import template from '@babel/template';
import { NodePath } from '@babel/traverse';
// import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import TraceCfg from '../../definitions/TraceCfg';
import { astNodeToString } from '../../helpers/pathHelpers';
import { makeInputs, ZeroNode } from './buildHelpers';
import { getInstrumentTargetNode } from './common';
import { buildTraceExpressionSimple, buildTraceId } from './misc';


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


function buildArgsValue(state, argNodes) {
  const { ids: { aliases: {
    arrayFrom
  } } } = state;
  return t.arrayExpression(argNodes
    .map(argNode => t.isSpreadElement(argNode) ?
      t.callExpression(
        arrayFrom,
        argNode.argument
      ) :
      argNode
    )
  );
}

function buildArgI(argsVar, i) {
  return t.memberExpression(argsVar, t.numericLiteral(i), true, false);
}

function buildSpreadLengths(state, argsVar, argNodes) {
  const { ids: { aliases: {
    getArgLength
  } } } = state;
  return t.arrayExpression(argNodes
    .map((argNode, i) => t.isSpreadElement(argNode) ?
      t.callExpression(
        getArgLength,
        buildArgI(argsVar, i)
      ) :
      null
    )
    .filter(n => !!n)
  );
}

/**
 * Build call arguments as array of Nodes, spread elements as necessary.
 * @example `[argsVar[0], argsVar[1], ...argsVar[2], argsVar[3]]`
 */
function buildCallArgs(argsVar, argNodes) {
  return argNodes.map((argNode, i) => {
    const arg = buildArgI(argsVar, i);
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
function buildBCE(state, traceCfg, spreadLengths) {
  const { ids: { aliases: {
    traceBCE
  } } } = state;
  const {
    inputTraces
  } = traceCfg;

  const tid = buildTraceId(state, traceCfg);
  const argTids = makeInputs(inputTraces);

  return t.callExpression(traceBCE, [
    tid,
    argTids,
    spreadLengths
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
  const argsPath = path.get('arguments');
  const argNodes = argsPath?.map(a => a.node) || EmptyArray;

  // const calleeVar = generateVar(scope, 'f'); // generateCalleeVar(calleePath);
  const argsVar = generateVar(scope, 'args');

  const args = buildArgsValue(state, argNodes);
  const spreadLengths = buildSpreadLengths(state, argsVar, argNodes);

  return t.sequenceExpression([
    // (i) callee assignment - `f = ...`
    t.assignmentExpression('=', calleeVar, calleePath.node),

    // (ii) args assignment - `args = [...]`
    t.assignmentExpression('=', argsVar, args),

    // (iii) BCE - `bce(tid, argTids, spreadLengths)`
    buildBCE(state, bceTrace, spreadLengths),

    // (iv) wrap actual call - `tcr(f(args[0], ...args[1], args[2]))`
    buildTraceExpressionSimple(
      buildCallNodeDefault(path, calleeVar, argsVar, argNodes),
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

  const argsPath = path.get('arguments');
  const argNodes = argsPath.node || EmptyArray;

  const argsVar = generateVar(scope, 'args');

  const args = buildArgsValue(state, argNodes);
  const spreadLengths = buildSpreadLengths(state, argsVar, argNodes);

  // hackfix: override targetNode during instrumentation (generally, not a great idea, is it?)
  traceCfg.meta.targetNode = buildCallNodeME(path, objectVar, calleeVar, argsVar, argNodes);
  debug(`tcr target: ${astNodeToString(getInstrumentTargetNode(traceCfg))}`);

  return t.sequenceExpression([
    // (i) object assignment - `o = ...`
    t.assignmentExpression('=', objectVar, objectPath.node),

    // (ii) callee assignment - `f = ...`
    t.assignmentExpression('=', calleeVar, calleeAstNode),

    // (iii) args assignment - `args = [...]`
    t.assignmentExpression('=', argsVar, args),

    // (iv) BCE - `bce(tid, argTids, spreadLengths)`
    buildBCE(state, bceTrace, spreadLengths),

    // (v) wrap actual call - `tcr(f.call(o, args[0], ...args[1], args[2]))`
    buildTraceExpressionSimple(
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

