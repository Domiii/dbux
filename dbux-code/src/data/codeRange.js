import { babelLocToCodeRange } from '../helpers/locHelper';
import { EmptyArray } from 'dbux-common/src/util/arrayUtil';

/**
 * This file provides data/query utilities for all kinds of data that 
 * revolve around or require VSCode features Range + Position.
 * 
 * @file
 */

/**
 * TODO: improve performance, use MultiKeyIndex instead
 */
export function getVisitedStaticTracesAt(application, programId, pos) {
  const staticTraces = application.dataProvider.indexes.staticTraces.visitedByFile.get(programId);
  return staticTraces.filter(staticTrace => {
    const range = babelLocToCodeRange(staticTrace.loc);
    return range.contains(pos);
  });
}


function filterTracesOfLastStaticContext(application, traces) {
  const lastStaticContextId = traces.reduce((first, trace) => {
    const staticContextId = application.dataProvider.util.getTraceStaticContextId(trace.traceId);
    return Math.max(first, staticContextId);
  }, 0);

  return traces.filter(trace => {
    const staticContextId = application.dataProvider.util.getTraceStaticContextId(trace.traceId);
    return staticContextId === lastStaticContextId;
  });
}

export function getVisitedTracesAt(application, programId, pos) {
  const staticTraces = getVisitedStaticTracesAt(application, programId, pos);
  // const traces = application.dataProvider.indexes.traces.visitedByFile.get(programId);
  const traceGroups = (staticTraces || EmptyArray).map(staticTrace => {
    const { staticTraceId } = staticTrace;
    return application.dataProvider.indexes.traces.byStaticTrace.get(staticTraceId);
  });
  
  const traces = traceGroups
    .filter(tracesOfStaticTrace => !!tracesOfStaticTrace)
    .flat();

  // return traces;
  return filterTracesOfLastStaticContext(application, traces);
}