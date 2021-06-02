// import template from '@babel/template';
import * as t from '@babel/types';
import { newLogger } from '@dbux/common/src/log/logger';
import { buildTraceCall, bindTemplate, bindExpressionTemplate } from '../../helpers/templateUtil';
import { makeInputs, ZeroNode } from './buildHelpers';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('builders/trace');

const Verbose = 2;

export const buildTraceId = bindExpressionTemplate(
  '%%traceId%% = %%newTraceId%%(%%staticTraceId%%)',
  function buildTraceId(state, { tidIdentifier, inProgramStaticTraceId }) {
    const { ids: { aliases: {
      newTraceId
    } } } = state;

    return {
      newTraceId,
      staticTraceId: t.numericLiteral(inProgramStaticTraceId),
      traceId: tidIdentifier
    };
  },
);

// ###########################################################################
// traceExpression
// ###########################################################################

/**
 * 
 */
export const buildTraceExpression = buildTraceCall(
  '%%trace%%(%%expr%%, %%tid%%, %%declarationTid%%, %%inputs%%)',
  function buildTraceExpression(expressionNode, state, traceCfg) {
    // const { scope } = path;
    const { ids: { aliases } } = state;
    const trace = aliases[traceCfg?.meta?.traceCall || 'traceExpression'];
    if (!trace) {
      throw new Error(`Invalid meta.traceCall "${traceCfg.meta.traceCall}" - Valid choices are: ${Object.keys(aliases).join(', ')}`);
    }

    const {
      declarationTidIdentifier,
      inputTraces
    } = traceCfg;

    const tid = buildTraceId(state, traceCfg);
    // Verbose && debug(`[te] ${expressionNode.type} [${inputTraces?.map(i => i.tidIdentifier.name).join(',') || ''}]`, getPresentableString(expressionNode));

    // NOTE: templates only work on `Node`, not on `NodePath`, thus they lose all path-related information.

    return {
      trace,
      expr: expressionNode,
      tid,
      declarationTid: declarationTidIdentifier || ZeroNode,
      inputs: makeInputs(inputTraces)
    };
  }
);

/**
 * 
 */
export const buildTraceExpressionNoInput = buildTraceCall(
  '%%trace%%(%%expr%%, %%tid%%, %%declarationTid%%)',
  function buildTraceExpressionNoInput(expressionNode, state, traceCfg) {
    // const { scope } = path;
    const { ids: { aliases } } = state;
    const trace = aliases[traceCfg?.meta?.traceCall || 'traceExpression'];
    if (!trace) {
      throw new Error(`Invalid meta.traceCall "${traceCfg.meta.traceCall}" - Valid choices are: ${Object.keys(aliases).join(', ')}`);
    }

    const {
      declarationTidIdentifier
    } = traceCfg;

    const tid = buildTraceId(state, traceCfg);
    // Verbose && debug(`[te] ${expressionNode.type} [${inputTraces?.map(i => i.tidIdentifier.name).join(',') || ''}]`, getPresentableString(expressionNode));

    // NOTE: templates only work on `Node`, not on `NodePath`, thus they lose all path-related information.

    return {
      trace,
      expr: expressionNode,
      tid,
      declarationTid: declarationTidIdentifier || ZeroNode
    };
  }
);

/**
 * Same as `buildTraceExpression` but without declaration nor inputs.
 */
export const buildTraceExpressionSimple = buildTraceCall(
  '%%trace%%(%%expr%%, %%tid%%)',
  function buildTraceExpressionSimple(expressionNode, state, traceCfg) {
    const { ids: { aliases } } = state;
    const trace = aliases[traceCfg?.meta?.traceCall || 'traceExpression'];
    if (!trace) {
      throw new Error(`Invalid meta.traceCall "${traceCfg.meta.traceCall}" - Valid choices are: ${Object.keys(aliases).join(', ')}`);
    }

    const tid = buildTraceId(state, traceCfg);
    // Verbose && debug(`[te] ${expressionNode.type} [${inputTraces?.map(i => i.tidIdentifier.name).join(',') || ''}]`, getPresentableString(expressionNode));
    // NOTE: templates only work on `Node`, not on `NodePath`, thus they lose all path-related information.

    return {
      trace,
      expr: expressionNode,
      tid
    };
  }
);

// ###########################################################################
// traceDeclaration
// ###########################################################################

export function buildTraceDeclarations(state, traceCfgs) {
  const { ids: { aliases: {
    traceDeclaration
  } } } = state;

  // return [
  const decls = traceCfgs.map(({ tidIdentifier, inProgramStaticTraceId }) => t.variableDeclarator(
    tidIdentifier,
    t.callExpression(traceDeclaration, [
      t.numericLiteral(inProgramStaticTraceId)
    ])
  ));
  return t.variableDeclaration('var', decls);
  // t.callExpression(traceDeclarations, traceCfgs.map())
  // ];
}

// ###########################################################################
// traceWrite
// ###########################################################################

// TODO: deferTid
export const buildTraceWrite = buildTraceCall(
  '%%traceWrite%%(%%expr%%, %%tid%%, %%declarationTid%%, %%inputs%%, %%deferTid%%)',
  function buildTraceWrite(expr, state, traceCfg) {
    const { ids: { aliases: {
      traceWrite
    } } } = state;

    const {
      declarationTidIdentifier,
      inputTraces
    } = traceCfg;

    const tid = buildTraceId(state, traceCfg);

    const declarationTid = declarationTidIdentifier || ZeroNode;
    const deferTid = ZeroNode;

    return {
      expr,
      traceWrite,
      tid,
      declarationTid,
      inputs: makeInputs(inputTraces),
      deferTid
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
// traceMemberExpression
// ###########################################################################

export const buildTraceMemberExpression = bindTemplate(
  '%%tme%%(%%obj%%, %%prop%%, %%tid%%, %%inputs%%)',
  function buildTraceMemberExpression(path, state, traceCfg) {
    // const { scope } = path;
    const { ids: { aliases } } = state;
    const trace = aliases[traceCfg?.meta?.traceCall || 'traceMemberExpression'];
    if (!trace) {
      throw new Error(`Invalid meta.traceCall "${traceCfg.meta.traceCall}" - Valid choices are: ${Object.keys(aliases).join(', ')}`);
    }

    const obj = path.node.object;
    let prop;
    if (!path.node.computed && path.get('property').isIdentifier()) {
      // NOTE: `o.x` becomes `tme(..., 'x', ...)`
      //      -> convert `Identifier` to `StringLiteral`
      prop = t.stringLiteral(path.node.property.name);
    }
    else {
      // keep property as-is
      prop = path.node.property;
    }

    const {
      inputTraces
    } = traceCfg;

    const tid = buildTraceId(state, traceCfg);
    // Verbose && debug(`[te] ${expressionNode.type} [${inputTraces?.map(i => i.tidIdentifier.name).join(',') || ''}]`, getPresentableString(expressionNode));

    // NOTE: templates only work on `Node`, not on `NodePath`, thus they lose all path-related information.

    return {
      tme: trace,
      obj,
      prop,
      tid,
      inputs: makeInputs(inputTraces)
    };
  }
);