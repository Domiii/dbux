import template from '@babel/template';
import * as t from '@babel/types';
import { newLogger } from '@dbux/common/src/log/logger';
import { getPresentableString } from '../helpers/pathHelpers';
import { bindTemplate } from '../helpers/templateUtil';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('builders/trace');

const Verbose = 2;

export const buildTraceId = bindTemplate(
  '%%traceId%% = %%makeTraceId%%(%%staticTraceId%%)',

  function buildTraceId(templ, state, traceIdVar, inProgramStaticTraceId) {
    // TODO: add custom trace data
    const { ids: { aliases: {
      makeTraceId
    } } } = state;

    return templ({
      makeTraceId,
      staticTraceId: t.numericLiteral(inProgramStaticTraceId),
      traceId: traceIdVar
    });
  }
);

export const buildTraceExpression = bindTemplate(
  '%%traceExpression%%(%%expr%%, %%tid%%)',
  function buildTraceExpression(templ, path, state, traceType) {
    // TODO: add custom trace data
    // const { scope } = path;
    const { ids: { aliases: {
      traceExpression
    } } } = state;

    const tid = buildTraceId(path, state, traceType);
    const expr = path.node;
    Verbose && debug('[te]', getPresentableString(path));

    // NOTE: templates only work on `Node`, not on `NodePath`, thus they lose all path-related information.
    
    // TODO: keep `path` data etc, if necessary - `onCopy(path, newPath);`

    return templ({
      traceExpression,
      expr,
      tid
    });
  }
);

export const buildTraceNoValue = function buildTraceNoValue(templ, path, state, traceType) {
  const { ids: { dbux } } = state;
  const traceId = state.traces.addTrace(path, traceType);
  // console.warn(`traces`, state.traces);
  return templ({
    dbux,
    traceId: t.numericLiteral(traceId)
  });
}.bind(null, template('%%dbux%%.t(%%traceId%%)'));

