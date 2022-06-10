import template from '@babel/template';
import { NodePath } from '@babel/traverse';
// import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
// import { newLogger } from '@dbux/common/src/log/logger';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import TraceCfg from '../../definitions/TraceCfg';
import { makeInputs, NullNode, ZeroNode } from './buildUtil';
import { buildTraceId } from './traceId';
import { buildSpreadableArgArrayNoSpread, buildGetI } from './arrays';
import { buildTraceExpressionNoInput } from './misc';
import { buildMEObject } from './me';
import { pathToStringAnnotated } from '../../helpers/pathHelpers';


const ThisNode = t.thisExpression();

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

// function buildSpreadArgs(argsVar, argNodes) {
//   // const { ids: { aliases: {
//   //   getArgLength
//   // } } } = state;
//   return t.arrayExpression(argNodes
//     .map((argNode, i) => t.isSpreadElement(argNode) ?
//       // t.callExpression(
//       //   getArgLength,
//       buildGetI(argsVar, i) :
//       // ) :
//       NullNode
//     )
//     .filter(n => !!n)
//   );
// }



/**
 * Build call arguments as array of Nodes; spread elements as necessary.
 * @example `[argsVar[0], ...argsVar[1], ...argsVar[2], argsVar[3]]`
 */
function buildCallArgs(state, argsVar, argNodes) {
  // const { ids: { aliases: { traceArg, traceSpreadArg } } } = state;

  return argNodes.map((argNode, i) => {
    const argI = buildGetI(argsVar, i);
    return t.isSpreadElement(argNode) ?
      // t.spreadElement(t.callExpression(traceSpreadArg, [argI])) :
      // t.callExpression(traceArg, [argI]);
      t.spreadElement(argI) :
      argI;
  });
}

// ###########################################################################
// BCE
// ###########################################################################

/**
 * @param {DbuxState} state 
 * @param {TraceCfg} traceCfg 
 * @param {BaseNode} calleeNode The callee BaseNode (used to get `calleeTid`).
 */
function buildBCE(state, traceCfg, calleeVar, calleeNode, args) {
  const { ids: { aliases: {
    traceBCE
  } } } = state;

  const tid = buildTraceId(state, traceCfg);
  const calleeTid = calleeNode?.getTidIdentifier() || ZeroNode;
  const argTids = makeInputs(traceCfg);

  return t.callExpression(traceBCE, [
    tid,
    calleeVar || NullNode,
    calleeTid,
    argTids,
    args
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
   * NOTE: optional chaining, for some reason, does not accept `args` like the others do...
   * 
   * @see https://babeljs.io/docs/en/babel-plugin-proposal-optional-chaining#example-1
   * @see https://github.com/babel/babel/blob/master/packages/babel-plugin-proposal-optional-chaining/src/index.js#L111
   */
  OptionalCallExpression: template(
    // `%%callee%%?.apply(%%o%%, %%args%%)`
    `%%callee%% == null ? void 0 : %%callee%%(%%args%%)`
  ),

  // /**
  //  * @see https://github.com/babel/babel/blob/master/packages/babel-plugin-proposal-optional-chaining/src/index.js
  //  */
  // OptionalCallExpression: template(`
  //   %%callee%%?.(%%args%%)
  // `),

  NewExpression: template(`
    new %%callee%%(%%args%%)
  `)
};

function buildCallNodeDefault(path, callee, args) {
  const { type } = path.node;
  const callTemplate = callTemplatesDefault[type];
  const templateArgs = {
    callee,
    args
  };

  let astNode = callTemplate(templateArgs);
  if (astNode.expression) {
    // NOTE: `template` generates `ExpressionStatement`
    astNode = astNode.expression;
  }

  // NOTE: not sure if this can improve call trace accuracy
  astNode.loc = path.node.loc;

  // future-work: requires a bit more work in case of optional chaining
  astNode.callee && (astNode.callee.loc = path.node.callee.loc);

  return astNode;
}


// ###########################################################################
// CallExpression templates (ME)
// ###########################################################################

// future-work: consider replacing the call templates with 3 different runtime calls instead
//    -> this way we could produce additional information regarding the invalid call (such as the `staticTrace.displayName`)
//    -> this is needed, since the stacktrace tends to get very inaccurate (the containing function's name tends to be correct)

// /**
//  * Current Babel generates incorrect AST information,
//  * resulting in `args` array being rejected and causing `Error("Cannot replace single expression with an array...")`
//  * in `template/lib/populate.js`.
//  * (analysis: because it's internal `placeholder` object has `type = 'other'`, even though it should be`'param'`.)*/

// const callIdAstNode = t.identifier('call');
// /** 
//  * NOTE: We can't use `template` because we need to spread the args array.
//  */
// function buildOptionalCallExpressionME({ callee, o, args }) {
//   return t.callExpression(
//     t.optionalMemberExpression(callee, callIdAstNode, false, true),
//     [
//       o,
//       ...args
//     ]
//   );
// }

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

  // OptionalCallExpression: () => buildOptionalCallExpressionME,

  /**
   * NOTE: optional chaining, for some reason, does not accept `args` like the others do...
   * 
   * @see https://babeljs.io/docs/en/babel-plugin-proposal-optional-chaining#example-1
   * @see https://github.com/babel/babel/blob/master/packages/babel-plugin-proposal-optional-chaining/src/index.js#L111
   */
  OptionalCallExpression: () => template(
    // `%%callee%%?.apply(%%o%%, %%args%%)`
    `%%callee%% == null ? void 0 : %%callee%%.call(%%o%%, %%args%%)`
  ),

  // NewExpression: 

  NewExpression: () => template(`
    new %%callee%%(%%args%%)
`)
};

function buildCallNodeME(path, traceCfg, calleeVar, args) {
  const { type } = path.node;
  const callTemplate = callTemplatesME[type]();

  const templateArgs = {
    callee: calleeVar,
    args
  };

  if (type !== 'NewExpression') {
    // NOTE: `NewExpression` does not have `o` (no need to trace separately)

    const {
      data: {
        objectVar
      }
    } = traceCfg;

    if (!objectVar) {
      throw new Error(`Untraced object in CallExpressionME: ${pathToStringAnnotated(traceCfg.path, true)}`);
    }
    templateArgs.o = objectVar;
  }

  let astNode = callTemplate(templateArgs);
  if (astNode.expression) {
    // NOTE: `template` generates `ExpressionStatement`
    astNode = astNode.expression;
  }

  // NOTE: not sure if this can improve call trace accuracy
  astNode.loc = path.node.loc;

  // future-work: requires a bit more work in case of optional chaining
  astNode.callee && (astNode.callee.loc = path.node.callee.loc);

  return astNode;
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
      calleeNode,
      bceTrace,
      calleeVar
    }
  } = traceCfg;

  const calleePath = path.get('callee');

  const argPaths = path.get('arguments');
  const argsVar = generateVar(scope, 'args');
  const argsArray = buildSpreadableArgArrayNoSpread(argPaths);
  const argNodes = argPaths?.map(a => a.node) || EmptyArray;
  // const spreadArgs = buildSpreadArgs(argsVar, argNodes);
  const callArgs = buildCallArgs(state, argsVar, argNodes);
  const argsAssignment = [t.assignmentExpression('=', argsVar, argsArray)];

  // hackfix: override targetNode during instrumentation - `f(args[0], ...args[1], args[2])`
  traceCfg.meta.targetNode = buildCallNodeDefault(path, calleeVar, callArgs);

  return t.sequenceExpression([
    // (i) callee assignment - `f = ...`
    t.assignmentExpression('=', calleeVar, calleePath.node),

    // (ii) args assignment - `args = [...]`
    ...argsAssignment,

    // (iii) BCE - `f = bce(tid, f, calleeTid, argTids, args)`
    t.assignmentExpression('=', calleeVar, buildBCE(state, bceTrace, calleeVar, calleeNode, argsVar)),

    // (iv) wrap actual call - `tcr(targetNode)`
    buildTraceExpressionNoInput(
      // NOTE: targets `traceCfg.meta.targetNode`
      state,
      traceCfg
    )
  ]);
}


// ###########################################################################
// buildTraceCallUntraceableCallee
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
      bceTrace,
      shouldTraceArgs
      // calleeNode
    }
  } = traceCfg;

  const calleePath = path.get('callee');


  const argPaths = path.get('arguments');
  const argNodes = argPaths?.map(a => a.node) || EmptyArray;

  let argsAssignment, callArgs;
  const argsVar = generateVar(scope, 'args');
  if (shouldTraceArgs) {
    callArgs = buildCallArgs(state, argsVar, argNodes);
    argsAssignment = [t.assignmentExpression('=',
      argsVar,
      buildSpreadableArgArrayNoSpread(argPaths)
    )];
    // spreadArgs = buildSpreadArgs(argsNoSpread, argNodes);
  }
  else {
    callArgs = argNodes;
    argsAssignment = EmptyArray;
    // spreadArgs = t.arrayExpression();
  }

  // hackfix: override targetNode during instrumentation - `f(args[0], ...args[1], args[2])`
  traceCfg.meta.targetNode = buildCallNodeDefault(path, calleePath.node, callArgs);

  return t.sequenceExpression([
    // (i) args assignment - `args = [...]`
    ...argsAssignment,

    // (ii) BCE - `bce(tid, argTids, spreadArgs)`
    buildBCE(state, bceTrace, null, null, argsVar),

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
      calleeNode,
      calleeVar,
      // objectPath,
      calleeTrace,
      objectVar
    }
  } = traceCfg;

  let calleeAstNode;

  // NOTE: callee was built (but not replaced) by MemberExpression
  ({ resultNode: calleeAstNode } = calleeTrace);

  const calleePath = path.get('callee');
  const meAstNode = calleePath.node;

  const argPaths = path.get('arguments');
  const argsVar = generateVar(scope, 'args');
  const args = buildSpreadableArgArrayNoSpread(argPaths);
  const argNodes = argPaths?.map(a => a.node) || EmptyArray;
  // const spreadArgs = buildSpreadArgs(argsVar, argNodes);

  // hackfix: override targetNode during instrumentation - `f(args[0], ...args[1], args[2])`
  traceCfg.meta.targetNode = buildCallNodeME(path, traceCfg, calleeVar, buildCallArgs(state, argsVar, argNodes));
  // debug(`tcr target: ${astNodeToString(getInstrumentTargetNode(traceCfg))}`);

  const expressions = [];

  // hackfix: super
  const objectAstNode = meAstNode.object;
  const obj = objectAstNode.type !== 'Super' ? 
    t.assignmentExpression('=', objectVar, objectAstNode) :
    ThisNode;

  expressions.push(
    // (i) object assignment - `o = ...`
    obj,

    // (ii) callee assignment - `f = ...`
    t.assignmentExpression('=', calleeVar, calleeAstNode),

    // (iii) args assignment - `args = [...]`
    t.assignmentExpression('=', argsVar, args),

    // (iv) BCE - `bce(tid, f, calleeTid, argTids, spreadArgs)`
    t.assignmentExpression('=', calleeVar, buildBCE(state, bceTrace, calleeVar, calleeNode, argsVar)),

    // (v) wrap actual call - `tcr(f.call(o, args[0], ...args[1], args[2]))`
    buildTraceExpressionNoInput(
      // NOTE: targets `traceCfg.meta.targetNode`
      state,
      traceCfg
    )
  );

  return t.sequenceExpression(expressions);
}
