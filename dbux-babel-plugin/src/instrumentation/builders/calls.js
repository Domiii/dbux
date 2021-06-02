import template from '@babel/template';
// import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { newLogger } from '@dbux/common/src/log/logger';
import TraceCfg from '../../definitions/TraceCfg';
import { makeInputs, ZeroNode } from './buildHelpers';
import { buildTraceExpressionSimple, buildTraceId } from './misc';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('builders/trace');

/**
 * Call templates if callee is MemberExpression.
 * NOTE: the call templates do not have arguments. We will put them in manually, so as to avoid loss of path data.
 * NOTE: the `null` expression (i.e. `newPath.get('expressions.2')`) is a placeholder for BCE id.
 */
const callTemplatesMember = {
  // NOTE: `f.call.call(f, args)` also works 
  //        i.e. `f.call(this, 1);`
  //          -> `f.call.call(f, this, 1))`
  CallExpression: () => template(`
    %%callee%%.apply(%%o%%, %%args%%)
  `),

  /**
   * @see https://github.com/babel/babel/blob/master/packages/babel-plugin-proposal-optional-chaining/src/index.js
   */
  OptionalCallExpression: () => template(`
    %%callee%%?.apply(%%o%%, %%args%%)
  `),

  NewExpression: () => template(`
    new %%callee%%(%%args%%)
`)
};

/**
 * Call templates if callee is Identifier.
 */
const callTemplatesVar = {
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

/**
 * NOTE: the name chosen here will show up in error messages
 */
function generateCalleeVar(calleePath) {
  const id = calleePath.scope.generateUidIdentifierBasedOnNode(calleePath.node);
  this.push({
    id
  });
  return id;
  // return calleePath.node.name || 'func';
}


// ###########################################################################
// arguments
// ###########################################################################


function buildArgsValue(state, argsPath) {
  const { ids: { aliases: {
    arrayFrom
  } } } = state;
  return t.arrayExpression(argsPath.node.map(argNode =>
    t.isSpreadElement(argNode) ?
      t.callExpression(
        arrayFrom,
        argNode.argument
      ) :
      argNode));
}

function buildArgI(argsVar, i) {
  return t.memberExpression(argsVar, t.numericLiteral(i), true, false);
}

function buildSpreadLengths(state, argsVar, argsPath) {
  const { ids: { aliases: {
    getArgLength
  } } } = state;
  return t.arrayExpression(argsPath.node
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

function buildCallArgs(argsVar, argsPath) {
  return argsPath.node.map((argNode, i) => {
    const arg = buildArgI(argsVar, i);
    return t.isSpreadElement(argNode) ?
      t.spreadElement(arg) :
      arg;
  });
}

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

function buildCallNode(path, calleeVar, argsVar, argsPath) {
  const { type } = path.node;
  const callTempl = callTemplatesVar[type];
  return callTempl({
    callee: calleeVar,
    args: buildCallArgs(argsVar, argsPath)
  });
}

// ###########################################################################
// traceCall
// ###########################################################################

/**
 * @param {TraceCfg} traceCfg 
 * @returns 
 */
export function buildTraceCallVar(state, traceCfg) {
  const {
    path,
    path: {
      scope
    },
    data: { bceTrace }
  } = traceCfg;

  const calleePath = path.get('callee');
  const argsPath = path.get('arguments');
  const calleeVar = generateCalleeVar(calleePath);
  const argsVar = scope.generateUidIdentifier('args');

  // TODO: onCopy(callee)
  // TODO: args.forEach(arg => onCopy(arg))
  // TODO: onCopy(result)

  const args = buildArgsValue(argsPath);
  const spreadLengths = buildSpreadLengths(argsVar, argsPath);

  return t.sequenceExpression([
    // (i) callee assignment - `callee = te(...)`
    t.assignmentExpression('=', calleeVar, calleePath),

    // (ii) args assignment `args = [...]`
    t.assignmentExpression('=', argsVar, args),

    // (iii) BCE - `tbce(tid, argTids, spreadLengths)`
    buildBCE(state, bceTrace, spreadLengths),

    // (iv) actual call
    buildTraceExpressionSimple(
      buildCallNode(path, calleeVar, argsVar, argsPath),
      state,
      traceCfg
    )
  ]);
}

// export const buildTraceCallArgument = buildTraceCall(
//   '%%traceCallArgument%%(%%expr%%, %%tid%%, %%declarationTid%%, %%calleeTid%%, %%inputs%%)',
//   function buildTraceCallArgument(expr, state, traceCfg) {
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

