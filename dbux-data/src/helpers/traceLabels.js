import TraceType from 'dbux-common/src/core/constants/TraceType';
import { makeContextLabel } from './contextLabels';

function makeTraceTraceContextLabel(trace, application) {
  const context = application.dataProvider.collections.executionContexts.getById(trace.contextId);
  return makeContextLabel(context, application);
}

function makeDefaultTraceLabel(trace, application) {
  const {
    traceId,
    staticTraceId
  } = trace;

  const staticTrace = application.dataProvider.collections.staticTraces.getById(staticTraceId);
  const {
    displayName
  } = staticTrace;
  const traceType = application.dataProvider.util.getTraceType(traceId);
  const typeName = TraceType.nameFrom(traceType);
  const title = displayName || `[${typeName}]`;
  return `${title}`;
}

const byType = {
  [TraceType.PushImmediate](trace, application) {
    return `↳ ${makeTraceTraceContextLabel(trace, application)}`;
  },
  [TraceType.PopImmediate](trace, application) {
    return `⤴ ${makeTraceTraceContextLabel(trace, application)}`;
  },
  [TraceType.CallbackArgument](trace, application) {
    // const context = application.dataProvider.collections.executionContexts.getById(trace.contextId);
    return `ƒ ${makeDefaultTraceLabel(trace, application)}`;
  },
  [TraceType.PushCallback](trace, application) {
    // const context = application.dataProvider.collections.executionContexts.getById(trace.contextId);
    // NOTE: nextTrace is inside callee
    const nextTrace = application.dataProvider.collections.traces.getById(trace.traceId + 1);
    return `↴ (callback) ${makeTraceTraceContextLabel(nextTrace, application)}`;
  },
  [TraceType.PopCallback](trace, application) {
    // const context = application.dataProvider.collections.executionContexts.getById(trace.contextId);
    // NOTE: previousTrace is inside callee
    const previousTrace = application.dataProvider.collections.traces.getById(trace.traceId - 1);
    return `↱ (callback) ${makeTraceTraceContextLabel(previousTrace, application)}`;
  },
  [TraceType.BeforeExpression](trace, application) {
    // const context = application.dataProvider.collections.executionContexts.getById(trace.contextId);
    return `✧ ${makeDefaultTraceLabel(trace, application)}`;
  },
  [TraceType.ExpressionResult](trace, application) {
    // const context = application.dataProvider.collections.executionContexts.getById(trace.contextId);
    return `${makeDefaultTraceLabel(trace, application)} ✦`;
  },
  [TraceType.CallbackArgument](trace, application) {
    // const context = application.dataProvider.collections.executionContexts.getById(trace.contextId);
    return `${makeDefaultTraceLabel(trace, application)} ✦`;
  },
  [TraceType.BlockStart](trace, application) {
    // const context = application.dataProvider.collections.executionContexts.getById(trace.contextId);
    return `↳`;
  },
  [TraceType.BlockEnd](trace, application) {
    // const context = application.dataProvider.collections.executionContexts.getById(trace.contextId);
    return `⤴`;
  }
};

export function makeTraceLabel(trace, application) {
  const {
    traceId
  } = trace;

  // custom by-type label
  const traceType = application.dataProvider.util.getTraceType(traceId);
  if (byType[traceType]) {
    return byType[traceType](trace, application);
  }

  // default trace label
  return makeDefaultTraceLabel(trace, application);
}