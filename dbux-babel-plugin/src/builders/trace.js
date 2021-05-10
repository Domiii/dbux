import template from '@babel/template';
import * as t from '@babel/types';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import { getPathTraceId } from '../data/StaticTraceCollection';
import { isAnyMemberExpression } from './functionHelpers';
import { isPathInstrumented, isNodeInstrumented } from '../helpers/astUtil';


export const buildTraceId = function buildTraceId(templ, path, state, traceType) {
  const { ids: { dbux } } = state;
  const traceId = state.traces.addTrace(path, traceType);
  // console.warn(`traces`, state.traces);
  return templ({
    dbux,
    traceId: t.numericLiteral(traceId)
  });
}.bind(null, template('%%dbux%%.%%traceId%%(%%traceId%%)')); // TODO: programId, inProgramStaticTraceId


export const buildTraceNoValue = function buildTraceNoValue(templ, path, state, traceType) {
  const { ids: { dbux } } = state;
  const traceId = state.traces.addTrace(path, traceType);
  // console.warn(`traces`, state.traces);
  return templ({
    dbux,
    traceId: t.numericLiteral(traceId)
  });
}.bind(null, template('%%dbux%%.t(%%traceId%%)'));

