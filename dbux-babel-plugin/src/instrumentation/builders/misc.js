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

    // Verbose && debug(`[te] ${expressionNode.type} [${inputTraces?.map(i => i.tidIdentifier.name).join(',') || ''}]`, pathToString(expressionNode));

    // NOTE: templates only work on `Node`, not on `NodePath`, thus they lose all path-related information.

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

export function buildTraceDeclarationVar(state, traceCfg, value) {
  const { tidIdentifier, inProgramStaticTraceId } = traceCfg;
  const trace = getTraceCall(state, traceCfg, 'traceDeclaration');
  const args = [t.numericLiteral(inProgramStaticTraceId)];
  value && args.push(value);
  addMoreTraceCallArgs(args, traceCfg);

  return t.variableDeclarator(
    tidIdentifier,
    applyPreconditionToExpression(traceCfg, t.callExpression(trace, args))
  );
}

export function buildTraceDeclarations(state, traceCfgs) {
  const decls = traceCfgs.map((traceCfg) => {
    let valueNode = traceCfg.data?.valueNode;
    if (isFunction(valueNode)) {
      valueNode = valueNode(state, traceCfg);
    }
    return buildTraceDeclarationVar(state, traceCfg, valueNode);
  });
  return t.variableDeclaration('var', decls);
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
