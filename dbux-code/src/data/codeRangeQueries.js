import findLast from 'lodash/findLast';
import StaticContext from 'dbux-common/src/core/data/StaticContext';
import Trace from 'dbux-common/src/core/data/Trace';
import { babelLocToCodeRange } from '../helpers/locHelper';
import Application from 'dbux-data/src/applications/Application';
import StaticContextType from 'dbux-common/src/core/constants/StaticContextType';

/**
 * This file provides data/query utilities for all kinds of data that 
 * use VSCode Range + Position features to find matching data entries at given positions and ranges.
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
 * NOTE: this will omit `Resume` staticContexts, since those have an unknown execution range
 */
export function getStaticContextAt(application, programId, pos): StaticContext {
  const staticContexts = application.dataProvider.indexes.staticContexts.byFile.get(programId);
  return findLast(staticContexts, staticContext => {
    const range = babelLocToCodeRange(staticContext.loc);
    return range.contains(pos);
  });
}

export function getTracesAt(application : Application, programId, pos) : Trace[] {
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
