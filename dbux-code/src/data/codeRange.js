import findLast from 'lodash/findLast';
import { babelLocToCodeRange } from '../helpers/locHelper';
import StaticContext from 'dbux-common/src/core/data/StaticContext';
import Trace from 'dbux-common/src/core/data/Trace';

/**
 * This file provides data/query utilities for all kinds of data that 
 * revolve around or require VSCode features Range + Position.
 * 
 * @file
 */

// export function getVisitedStaticTracesAt(application, programId, pos) {
//   const staticTraces = application.dataProvider.indexes.staticTraces.visitedByFile.get(programId);
//   return staticTraces.filter(staticTrace => {
//     const range = babelLocToCodeRange(staticTrace.loc);
//     return range.contains(pos);
//   });
// }

/**
 * TODO: improve performance, don't search through all `staticContexts` each time
 */
export function getStaticContextAt(application, programId, pos): StaticContext {
  const staticContexts = application.dataProvider.indexes.staticContexts.byFile.get(programId);
  return findLast(staticContexts, staticContext => {
    const range = babelLocToCodeRange(staticContext.loc);
    return range.contains(pos);
  });
}


export function getVisitedTracesAt(application, programId, pos) : Trace[] {
  // find staticContext (function or Program) at position
  const staticContext = getStaticContextAt(application, programId, pos);
  if (!staticContext) {
    return null;
  }

  // find all traces in context
  const { staticId: staticContextId } = staticContext;
  const traces = application.dataProvider.indexes.traces.byStaticContext.get(staticContextId);
  if (!traces) {
    return null;
  }

  // only return traces at cursor
  return traces.filter(trace => {
    const { staticTraceId } = trace;
    const staticTrace = application.dataProvider.collections.staticTraces.getById(staticTraceId);
    const range = babelLocToCodeRange(staticTrace.loc);
    return range.contains(pos);
  });
}