// import template from '@babel/template';
import * as t from '@babel/types';
import { newLogger } from '@dbux/common/src/log/logger';
import { getPresentableString } from '../../helpers/pathHelpers';
import { bindExpressionTemplate, bindTemplate } from '../../helpers/templateUtil';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('builders/trace');

const Verbose = 2;

export const buildTraceId = bindExpressionTemplate(
  '(%%traceId%% = %%newTraceId%%(%%staticTraceId%%))',
  function buildTraceId(state, { tidIdentifier, inProgramStaticTraceId }) {
    // TODO: add custom trace data
    const { ids: { aliases: {
      newTraceId
    } } } = state;

    return {
      newTraceId,
      staticTraceId: t.numericLiteral(inProgramStaticTraceId),
      traceId: tidIdentifier
    };
  }
);

export const buildTraceExpression = bindExpressionTemplate(
  '%%traceExpression%%(%%expr%%, %%tid%%, %%bindingTid%%, %%inputs%%)',
  function buildTraceExpression(path, state, traceCfg, bindingTidIdentifier, inputTidIds) {
    // const { scope } = path;
    const { ids: { aliases: {
      traceExpression
    } } } = state;

    const tid = buildTraceId(state, traceCfg);
    const expr = path.node;
    Verbose && debug(`[te] ${path.node.type} [${inputTidIds?.map(i => i.name).join(',') || ''}]`, getPresentableString(path));

    // NOTE: templates only work on `Node`, not on `NodePath`, thus they lose all path-related information.

    return {
      traceExpression,
      expr,
      tid,
      bindingTid: bindingTidIdentifier || t.nullLiteral(),
      inputs: t.arrayExpression(inputTidIds)
    };
  }
);

export const buildTraceWrite = bindExpressionTemplate(
  // TODO: value, tid, deferTid, ...inputs
  '%%traceWrite%%(%%expr%%, %%tid%%)',
  function buildTraceNoValue(path, state, traceCfg) {
    const { ids: { aliases: {
      traceWrite
    } } } = state;

    const tid = buildTraceId(state, traceCfg);
    const expr = path.node;
    Verbose && debug('[te]', getPresentableString(path));

    // NOTE: templates only work on `Node`, not on `NodePath`, thus they lose all path-related information.

    // TODO: keep `path` data etc, if necessary - `onCopy(path, newPath);`

    return {
      traceWrite,
      expr,
      tid
    };
  }
);


export const buildTraceNoValue = bindTemplate(
  '%%dbux%%.t(%%traceId%%)',
  function buildTraceNoValue(path, state, traceType) {
    const { ids: { dbux } } = state;
    const traceId = state.traces.addTrace(path, traceType);
    // console.warn(`traces`, state.traces);
    return {
      dbux,
      traceId: t.numericLiteral(traceId)
    };
  }
);

