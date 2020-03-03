import findLast from 'lodash/findLast';
import StaticContext from 'dbux-common/src/core/data/StaticContext';
import Trace from 'dbux-common/src/core/data/Trace';
import Application from 'dbux-data/src/applications/Application';
import StaticContextType from 'dbux-common/src/core/constants/StaticContextType';
import { babelLocToCodeRange } from './locHelpers';
import { EmptyArray } from 'dbux-common/src/util/arrayUtil';
import TraceType from 'dbux-common/src/core/constants/TraceType';

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
 * If not interruptable, returns array with static context of function.
 * If interruptable returns all Resume contexts.
 */
export function getStaticContextsAt(application, programId, pos): StaticContext {
  const { dataProvider } = application;
  const staticContexts = dataProvider.indexes.staticContexts.byFile.get(programId);
  const staticContext: StaticContext = findLast(staticContexts, staticContext => {
    const range = babelLocToCodeRange(staticContext.loc);
    return range.contains(pos);
  });

  if (!staticContext) {
    return null;
  }


  if (staticContext.type !== StaticContextType.Resume) {
    // just a normal function
    return [staticContext];
  }
  else {
    // interruptable function => return parent (the function itself), as well as all children of parent
    const { parentId } = staticContext;
    const parentContext = dataProvider.collections.staticContexts.getById(parentId);
    const children = dataProvider.indexes.staticContexts.byParent.get(parentId);
    return [
      parentContext,
      ...(children || EmptyArray)
    ];
  }
}

/**
 * TODO: *vastly* improve performance
 */
export function getTracesAt(application: Application, programId, pos): Trace[] {
  const dp = application.dataProvider;

  // find staticContext (function or Program) at position
  const staticContexts = getStaticContextsAt(application, programId, pos);
  if (!staticContexts) {
    return null;
  }

  // find all traces in context
  const traces = staticContexts.map(staticContext => {
    const { staticId: staticContextId } = staticContext;
    return dp.indexes.traces.byStaticContext.get(staticContextId) || EmptyArray;
  })
    .flat()
    .filter(trace => dp.util.getTraceType(trace.traceId) !== TraceType.BeforeCallExpression);
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
