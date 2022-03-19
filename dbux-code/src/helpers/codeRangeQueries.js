import maxBy from 'lodash/maxBy';
import StaticContext from '@dbux/common/src/types/StaticContext';
import Trace from '@dbux/common/src/types/Trace';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import { babelLocToCodePosition, babelLocToCodeRange } from './codeLocHelpers';

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
 * TODO: move to `dbux-data`, but need to implement `contains` first
 * @return {StaticContext}
 */
export function getStaticContextAt(application, programId, pos) {
  const { dataProvider } = application;
  /**
   * @type {StaticContext[]}
   */
  const staticContexts = dataProvider.indexes.staticContexts.byFile.get(programId);
  const mostInnerStaticContext = staticContexts.reduce((prevStaticContext, currentStaticContext) => {
    const prevRange = babelLocToCodeRange(prevStaticContext.loc);
    const currentRange = babelLocToCodeRange(currentStaticContext.loc);
    if (currentRange.contains(pos) && prevRange.contains(currentRange)) {
      return currentStaticContext;
    }
    else {
      return prevStaticContext;
    }
  });

  if (!mostInnerStaticContext) {
    return null;
  }


  // if (!staticContext.isInterruptable) {
  // just a normal function
  return mostInnerStaticContext;
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

const MaxTraceLabelLen = 50;

function getSameLineValue(dp, end, candidate) {
  const l = dp.util.getTraceLoc(candidate.traceId);
  // 1. must not span over multiple lines
  // 2. must include trace.end
  if (l.start.line !== l.end.line || l.end.column < end.column) {
    return -1;
  }

  // 3. must not exceed some size (e.g. in case of minimized code)
  const nStrLen = l.end.column - l.start.column;
  if (nStrLen > MaxTraceLabelLen) {
    return -1;
  }

  // 4. maximize loc range
  return l.end.column - l.start.column;
}

/**
 * @param {Trace} trace
 * @return {Trace} 
 */
export function getOuterMostTraceOfSameLine(trace) {
  const { traceId, applicationId } = trace;
  const application = allApplications.getApplication(applicationId);
  const dp = application.dataProvider;
  const programId = dp.util.getTraceProgramId(traceId);
  const { start, end } = dp.util.getTraceLoc(traceId);
  const startCodePos = babelLocToCodePosition(start);
  // const endCodePos = babelLocToCodePosition(end);

  let best;
  if (start.line === end.line) {
    let traces = getTracesAt(application, programId, startCodePos) || EmptyArray;

    const valueFun = getSameLineValue.bind(null, dp, end);
    best = maxBy(traces, valueFun);

    if (!best || valueFun(best) < 0) {
      // in case of no good trace -> pick original
      best = trace;
    }
  }
  else {
    best = trace;
  }
  return best;
}

