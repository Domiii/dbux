import isFunction from 'lodash/isFunction';
import * as t from '@babel/types';
import NestedError from '@dbux/common/src/NestedError';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import { pathToStringAnnotated } from '../../helpers/pathHelpers';
import { buildTraceCall, bindTemplate, bindExpressionTemplate } from './templateUtil';
import { addMoreTraceCallArgs, getTraceCall, makeInputs, NullNode, UndefinedNode } from './buildUtil';
import { applyPreconditionToExpression, getInstrumentTargetAstNode } from './common';
import { buildTraceId } from './traceId';
import { getDeclarationTid } from '../../helpers/traceUtil';

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

    // console.debug(`traceExpression ${traceCfg.inProgramStaticTraceId} ${expr.type}`);

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

/**
 * Custom trace call that does not call `newTraceId`.
 * 
 * @example `programMonitor.traceCall(inProgramStaticTraceId, ...moreTraceCallArgs)`
 * @return {t.Statement}
 */
export function buildTraceStatic(state, traceCfg) {
  const traceCall = getTraceCall(state, traceCfg);
  // const tid = buildTraceId(state, traceCfg);

  // const args = [tid];
  const { inProgramStaticTraceId } = traceCfg;
  const args = [t.numericLiteral(inProgramStaticTraceId)];
  addMoreTraceCallArgs(args, traceCfg);

  return t.expressionStatement(
    t.callExpression(traceCall, args)
  );
}

// ###########################################################################
// traceNoValue
// ###########################################################################

/**
 * @deprecated Use {@link buildTraceId} or {@link buildTraceStatic} instead.
 */
// eslint-disable-next-line camelcase
export const buildTraceNoValue_OLD = bindTemplate(
  '%%dbux%%.t(%%traceId%%)',
  // eslint-disable-next-line camelcase
  function buildTraceNoValue_OLD(path, state, staticTraceData) {
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
// traceDeclaration
// ###########################################################################

const keepStatementCfg = {
  meta: {
    isStatement: true
  }
};

export function buildTraceDeclarationVar(state, traceCfg) {
  const { inProgramStaticTraceId } = traceCfg;
  const trace = getTraceCall(state, traceCfg, 'traceDeclaration');
  const declarationTid = getDeclarationTid(traceCfg);
  let targetNode = traceCfg.meta?.targetNode;

  if (traceCfg.meta?.isRedeclaration) {
    // trace redeclaration
    // make sure, `tidIdentifier` is declared
    traceCfg.scope.push({
      id: traceCfg.tidIdentifier
    });
    return buildTraceExpressionVar(state, traceCfg, keepStatementCfg);
  }

  // build args
  const args = [t.numericLiteral(inProgramStaticTraceId)];
  if (isFunction(targetNode)) {
    targetNode = targetNode(state, traceCfg);
  }
  targetNode && args.push(targetNode);

  const inputs = makeInputs(traceCfg);
  if (traceCfg.meta?.moreTraceCallArgs) {
    if (inputs) {
      throw new Error(`Invalid var declaration: has "moreTraceCallArgs" and "inputs", but should only have either/or.`);
    }
    addMoreTraceCallArgs(args, traceCfg);
  }
  else if (inputs) {
    // add inputs
    args.push(inputs);
  }

  // call
  const tdCall = applyPreconditionToExpression(traceCfg, t.callExpression(trace, args));

  // NOTE: we cannot group them into a single `variableDeclaration` because of order
  return t.variableDeclaration('var', [
    t.variableDeclarator(
      declarationTid,
      tdCall
    )
  ]);
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


/** ###########################################################################
 * purpose
 *  #########################################################################*/

export const buildAddPurpose = buildTraceCall(
  '%%trace%%(%%expr%%, %%tid%%, %%purpose%%, %%arg%%)',
  function buildAddPurpose(state, traceCfg, expr) {
    const trace = getTraceCall(state, traceCfg, 'addPurpose');
    const tid = traceCfg.tidIdentifier;

    const {
      purpose,
      purposeArg: arg
    } = traceCfg.data;
    const purposeAst = t.numericLiteral(purpose);

    return {
      trace,
      expr,
      tid,
      purpose: purposeAst,
      arg: arg || NullNode
    };
  }
);


/** ###########################################################################
 * {@link doBuild}, {@link buildAll}
 * ##########################################################################*/

export function doBuild(state, traceCfg, buildDefault = buildTraceExpression) {
  const build = traceCfg.meta?.build || buildDefault;// getDefaultBuild(traceCfg);
  let result = build(state, traceCfg);
  if (traceCfg.data?.purpose) {
    result = buildAddPurpose(state, traceCfg, result);
  }
  return applyPreconditionToExpression(traceCfg, result);
}

export function doBuildDefault(state, traceCfg, build, buildDefault = buildTraceExpression) {
  build ||= buildDefault;
  let result = build(state, traceCfg);
  if (traceCfg.data?.purpose) {
    result = buildAddPurpose(state, traceCfg);
  }
  return applyPreconditionToExpression(traceCfg, result);
}


export function buildAll(state, traceCfgs, defaultBuild) {
  return traceCfgs.map((traceCfg) => {
    try {
      return doBuild(state, traceCfg, defaultBuild);
    }
    catch (err) {
      // eslint-disable-next-line max-len
      const { node, path, staticTraceData: { type } } = traceCfg;
      throw new NestedError(`Failed to instrument node="${node}", path="${pathToStringAnnotated(path, true)}", trace=${TraceType.nameFrom(type)}`, err);
    }
  });
}