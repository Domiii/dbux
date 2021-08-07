import * as t from '@babel/types';
import isFunction from 'lodash/isFunction';
import { buildTraceCall, bindTemplate, bindExpressionTemplate } from './templateUtil';
import { addMoreTraceCallArgs, getDeclarationTid, getTraceCall, makeInputs } from './buildUtil';
import { applyPreconditionToExpression, getInstrumentTargetAstNode } from './common';
import { buildTraceId } from './traceId';

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

export function buildTraceDeclarationVar(state, traceCfg) {
  const { inProgramStaticTraceId } = traceCfg;
  const trace = getTraceCall(state, traceCfg, 'traceDeclaration');
  const declarationTid = getDeclarationTid(traceCfg);

  // build args
  const args = [t.numericLiteral(inProgramStaticTraceId)];
  let valueNode = traceCfg.data?.valueNode;
  if (isFunction(valueNode)) {
    valueNode = valueNode(state, traceCfg);
  }
  valueNode && args.push(valueNode);
  addMoreTraceCallArgs(args, traceCfg);

  // call
  const callAstNode = applyPreconditionToExpression(traceCfg, t.callExpression(trace, args));

  // final statement
  if (traceCfg.data?.isRedeclaration) {
    return t.expressionStatement(callAstNode);
  }
  return t.variableDeclarator(
    declarationTid,
    callAstNode
  );
}

export function buildTraceDeclarations(state, traceCfgs) {
  const declarationCfgs = traceCfgs.filter(traceCfg => !traceCfg.data?.isRedeclaration);
  const decls = declarationCfgs.map((traceCfg) => {
    return buildTraceDeclarationVar(state, traceCfg);
  });

  const redeclarationCfgs = traceCfgs.filter(traceCfg => traceCfg.data?.isRedeclaration);
  const redeclarations = redeclarationCfgs.map(traceCfg => {
    return buildTraceDeclarationVar(state, traceCfg);
  });

  return [
    t.variableDeclaration('var', decls),
    ...redeclarations
  ];
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