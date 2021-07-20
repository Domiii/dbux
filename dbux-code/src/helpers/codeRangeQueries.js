import findLast from 'lodash/findLast';
import StaticContext from '@dbux/common/src/types/StaticContext';
import Trace from '@dbux/common/src/types/Trace';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import { babelLocToCodeRange } from './codeLocHelpers';

/** @typedef {import('@dbux/data/src/applications/Application').default} Application */

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
 * @return {StaticContext}
 */
export function getStaticContextAt(application, programId, pos) {
  const { dataProvider } = application;
  /**
   * @type {StaticContext[]}
   */
  const staticContexts = dataProvider.indexes.staticContexts.byFile.get(programId);
  const staticContext = findLast(staticContexts, entry => {
    const range = babelLocToCodeRange(entry.loc);
    return range.contains(pos);
  });

  if (!staticContext) {
    return null;
  }


  // if (!staticContext.isInterruptable) {
  // just a normal function
  return staticContext;
  // }
  // else {
  //   // interruptable function => return parent (the function itself), as well as all children of parent
  //   const { parentId } = staticContext;
  //   const parentContext = dataProvider.collections.staticContexts.getById(parentId);
  //   const children = dataProvider.indexes.staticContexts.byParent.get(parentId);
  //   return [
  //     parentContext,
  //     ...(children || EmptyArray)
  //   ];
  // }
}

/**
 * TODO: *vastly* improve performance
 * @param {Application} application
 * @param {number} programId
 * 
 * @return {Trace[]}
 */
export function getTracesAt(application, programId, pos) {
  const dp = application.dataProvider;

  // find inner most staticContext (function or Program) at position
  const staticContext = getStaticContextAt(application, programId, pos);
  if (!staticContext) {
    return null;
  }

  const {
    staticContextId
  } = staticContext;

  const traces = dp.util.getAllTracesOfStaticContext(staticContextId)
    ?.filter(trace =>
      !TraceType.is.CallExpressionResult(dp.util.getTraceType(trace.traceId))
    ) || [];

  // only return traces at cursor
  return traces.filter(trace => {
    const { staticTraceId } = trace;
    const staticTrace = application.dataProvider.collections.staticTraces.getById(staticTraceId);
    const range = babelLocToCodeRange(staticTrace.loc);
    return range.contains(pos);
  });
}
