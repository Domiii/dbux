import * as t from '@babel/types';
import isFunction from 'lodash/isFunction';
import { buildTraceCall, bindTemplate, bindExpressionTemplate } from './templateUtil';
import { addMoreTraceCallArgs, getDeclarationTid, getTraceCall, makeInputs } from './buildUtil';
import { applyPreconditionToExpression, getInstrumentTargetAstNode } from './common';
import { buildTraceId } from './traceId';
import { pathToString, pathToStringAnnotated } from '../../helpers/pathHelpers';

const Verbose = 2;


// ###########################################################################
// traceExpression
// ###########################################################################

/**
 * 
 */
export const buildTraceExpressionVar = buildTraceCall(
  '%%trace%%(%%expr%%, %%tid%%, %%declarationTid%%)',
  function buildTraceExpressionVar(state, traceCfg) {
    const trace = getTraceCall(state, traceCfg, 'traceExpressionVar');
    const tid = buildTraceId(state, traceCfg);
    const declarationTid = getDeclarationTid(traceCfg);

    return {
      trace,
      expr: getInstrumentTargetAstNode(state, traceCfg),
      tid,
      declarationTid
    };
  }
);
/**
 * 
 */
export const buildTraceExpression = buildTraceCall(
  '%%trace%%(%%expr%%, %%tid%%, %%inputs%%)',
  function buildTraceExpression(state, traceCfg) {
    const trace = getTraceCall(state, traceCfg);
    const expr = getInstrumentTargetAstNode(state, traceCfg);
    const tid = buildTraceId(state, traceCfg);

    return {
      trace,
      expr,
      tid,
      inputs: makeInputs(traceCfg)
    };
  }
);

/**
 * 
 */
export const buildTraceExpressionNoInput = buildTraceCall(
  '%%trace%%(%%expr%%, %%tid%%)',
  function buildTraceExpressionNoInput(state, traceCfg) {
    const trace = getTraceCall(state, traceCfg);
    const tid = buildTraceId(state, traceCfg);

    return {
      trace,
      expr: getInstrumentTargetAstNode(state, traceCfg),
      tid
    };
  }
);

// ###########################################################################
// traceDeclaration
// ###########################################################################

const keepStatementCfg = {
  meta: {
    keepStatement: true
  }
};

export function buildTraceDeclarationVar(state, traceCfg) {
  const { inProgramStaticTraceId } = traceCfg;
  const trace = getTraceCall(state, traceCfg, 'traceDeclaration');
  const declarationTid = getDeclarationTid(traceCfg);
  let targetNode = traceCfg.meta?.targetNode;

  // final statement
  if (traceCfg.meta?.isRedeclaration) {
    // if (valueNode) {
    //   // re-declaring param? -> this is probably not possible
    //   console.warn(`redeclaration of hoisted variable with write: "${pathToStringAnnotated(traceCfg.path, true)}" in "${traceCfg.node}"`);
    // }
    // else {
    return buildTraceExpressionVar(state, traceCfg, keepStatementCfg);
  }

  // build args
  const args = [t.numericLiteral(inProgramStaticTraceId)];
  if (isFunction(targetNode)) {
    targetNode = targetNode(state, traceCfg);
  }
  targetNode && args.push(targetNode);
  addMoreTraceCallArgs(args, traceCfg);

  // call
  const callAstNode = applyPreconditionToExpression(traceCfg, t.callExpression(trace, args));

  // NOTE: we cannot group them into a single `variableDeclaration` because of order
  return t.variableDeclaration('var', [
    t.variableDeclarator(
      declarationTid,
      callAstNode
    )
  ]);
}

export function buildTraceDeclarations(state, traceCfgs) {
  const decls = traceCfgs.map((traceCfg) => {
    return buildTraceDeclarationVar(state, traceCfg);
  });

  return decls;
}

// ###########################################################################
// traceWriteVar
// ###########################################################################

export const buildTraceWriteVar = buildTraceCall(
  '%%trace%%(%%expr%%, %%tid%%, %%declarationTid%%, %%inputs%%)',
  function buildTraceWriteVar(state, traceCfg) {
    const trace = getTraceCall(state, traceCfg, 'traceWriteVar');
    const tid = buildTraceId(state, traceCfg);
    const declarationTid = getDeclarationTid(traceCfg);

    return {
      trace,
      expr: getInstrumentTargetAstNode(state, traceCfg),
      tid,
      declarationTid,
      inputs: makeInputs(traceCfg)
    };
  }
);

// ###########################################################################
// traceNoValue
// ###########################################################################

/**
 * TODO: rewrite using `traceCfg`
 * @deprecated
 */
export const buildTraceNoValue = bindTemplate(
  '%%dbux%%.t(%%traceId%%)',
  function buildTraceNoValue(path, state, staticTraceData) {
    const { ids: { dbux } } = state;
    const traceId = state.traces.addTrace(path, staticTraceData);
    // console.warn(`traces`, state.traces);
    return {
      dbux,
      traceId: t.numericLiteral(traceId)
    };
  }
);



// ###########################################################################
// buildDefault
// ###########################################################################

export function buildDefault(state, traceCfg) {
  const build = traceCfg.meta?.build || buildTraceExpression;// getDefaultBuild(traceCfg);
  const result = build(state, traceCfg);
  return applyPreconditionToExpression(traceCfg, result);
}