// import template from '@babel/template';
import * as t from '@babel/types';
import { newLogger } from '@dbux/common/src/log/logger';
import { getPresentableString } from '../../helpers/pathHelpers';
import { buildTraceCall, bindTemplate, bindExpressionTemplate } from '../../helpers/templateUtil';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('builders/trace');

const Verbose = 2;

export const ZeroNode = t.numericLiteral(0);
export const NullNode = t.nullLiteral();
export const UndefinedNode = t.identifier('undefined');

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
      inputs: inputTraces && t.arrayExpression(inputTraces.map(i => i.tidIdentifier)) || NullNode
    };
  }
);

// ###########################################################################
// traceDeclaration
// ###########################################################################

export const buildTraceDeclaration = bindTemplate(
  '%%traceDeclaration%%(%%tid%%)',
  function buildTraceDeclaration(state, traceCfg) {
    const { ids: { aliases: {
      traceDeclaration
    } } } = state;

    const tid = buildTraceId(state, traceCfg);

    return {
      traceDeclaration,
      tid
    };
  }
);

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
      inputs: inputTraces && t.arrayExpression(inputTraces.map(i => i.tidIdentifier)) || NullNode,
      deferTid
    };
  }
);

// ###########################################################################
// traceCallArgument
// ###########################################################################

export const buildTraceCallArgument = buildTraceCall(
  '%%traceCallArgument%%(%%expr%%, %%tid%%, %%declarationTid%%, %%calleeTid%%, %%inputs%%)',
  function buildTraceCallArgument(expr, state, traceCfg) {
    const { ids: { aliases: {
      traceCallArgument
    } } } = state;

    const {
      declarationTidIdentifier,
      inputTraces,
      calleeTid
    } = traceCfg;

    const tid = buildTraceId(state, traceCfg);

    const declarationTid = declarationTidIdentifier || ZeroNode;

    return {
      expr,
      traceCallArgument,
      tid,
      declarationTid,
      inputs: inputTraces && t.arrayExpression(inputTraces.map(i => i.tidIdentifier)) || NullNode,
      calleeTid
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

