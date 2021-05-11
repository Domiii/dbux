import template from '@babel/template';
import * as t from '@babel/types';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import { newLogger } from '@dbux/common/src/log/logger';
import { getPathTraceId } from '../data/StaticTraceCollection';
import { isAnyMemberExpression } from './functionHelpers';
import { isPathInstrumented, isNodeInstrumented } from '../helpers/astUtil';
import { getPresentableString } from '../helpers/pathHelpers';
import { bindTemplate } from '../helpers/templateUtil';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('builders/trace');

const Verbose = 2;

export const buildTraceId = bindTemplate(
  '%%traceId%% = %%makeTraceId%%(%%staticTraceId%%)',

  function buildTraceId(templ, path, state, traceType) {
    // TODO: add custom trace data
    const { scope } = path;
    const { ids: { aliases: {
      makeTraceId
    } } } = state;
    const inProgramStaticTraceId = state.traces.addTrace(path, traceType);
    const traceId = scope.generateUidIdentifier(`t${inProgramStaticTraceId}_`);

    Verbose >= 2 && debug('[traceId]', traceId.name, getPresentableString(path));

    return templ({
      makeTraceId,
      staticTraceId: t.numericLiteral(inProgramStaticTraceId),
      traceId
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

