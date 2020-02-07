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

export function getVisitedTracesAt(application, programId, pos) {
  const staticTraces = getVisitedStaticTracesAt(application, programId, pos);
  // const traces = application.dataProvider.indexes.traces.visitedByFile.get(programId);
  return (staticTraces || EmptyArray).map(staticTrace => {
    const { staticTraceId } = staticTrace;
    return application.dataProvider.indexes.traces.byStaticTrace.get(staticTraceId);
  }).flat();
}