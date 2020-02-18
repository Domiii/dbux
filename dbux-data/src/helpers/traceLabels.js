import TraceType from 'dbux-common/src/core/constants/TraceType';
import { makeContextLabel } from './contextLabels';
import allApplications from '../applications/allApplications';

function makeTraceContextLabel(trace, application) {
  const context = application.dataProvider.collections.executionContexts.getById(trace.contextId);
  return makeContextLabel(context, application);
}

function makeTypeNameLabel(traceId, application) {
  const traceType = application.dataProvider.util.getTraceType(traceId);
  const typeName = TraceType.nameFrom(traceType);
  return `[${typeName}]`;
}

function makeCalleeTraceLabel(trace, application) {
  const calleeTrace = application.dataProvider.util.getCalleeStaticTrace(trace.traceId);
  if (calleeTrace) {
    return ` (arg of ${calleeTrace.displayName})`;
  }
  return '';
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
  const title = displayName || makeTypeNameLabel(traceId, application);
  return `${title}${makeCalleeTraceLabel(trace, application)}`;
}

const byType = {
  [TraceType.PushImmediate](trace, application) {
    return `↳ ${makeTraceContextLabel(trace, application)}`;
  },
  [TraceType.PopImmediate](trace, application) {
    return `⤴ ${makeTraceContextLabel(trace, application)}`;
  },
  [TraceType.BeforeExpression](trace, application) {
    // const context = application.dataProvider.collections.executionContexts.getById(trace.contextId);
    return `✧ ${makeDefaultTraceLabel(trace, application)}`;
  },
  [TraceType.ExpressionResult](trace, application) {
    // const context = application.dataProvider.collections.executionContexts.getById(trace.contextId);
    return `${makeDefaultTraceLabel(trace, application)} ✦`;
  },
  [TraceType.CallArgument](trace, application) {
    // const context = application.dataProvider.collections.executionContexts.getById(trace.contextId);
    return `${makeDefaultTraceLabel(trace, application)}`;
  },
  [TraceType.CallbackArgument](trace, application) {
    // const context = application.dataProvider.collections.executionContexts.getById(trace.contextId);
    return `ƒ ${makeDefaultTraceLabel(trace, application)}`;
  },
  [TraceType.PushCallback](trace, application) {
    // const context = application.dataProvider.collections.executionContexts.getById(trace.contextId);
    // NOTE: nextTrace is inside callee
    // const nextTrace = application.dataProvider.collections.traces.getById(trace.traceId + 1);
    // return `↴ (callback) ${makeTraceContextLabel(nextTrace, application)}`;
    return `↴ƒ ${makeDefaultTraceLabel(trace, application)}`;
  },
  [TraceType.PopCallback](trace, application) {
    // const context = application.dataProvider.collections.executionContexts.getById(trace.contextId);
    // NOTE: previousTrace is inside callee
    // const previousTrace = application.dataProvider.collections.traces.getById(trace.traceId - 1);
    return `↱ƒ ${makeDefaultTraceLabel(trace, application)}`;
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

export function makeTraceLabel(trace) {
  const {
    traceId
  } = trace;

  const application = allApplications.getById(trace.applicationId);

  // custom by-type label
  const traceType = application.dataProvider.util.getTraceType(traceId);
  if (byType[traceType]) {
    return byType[traceType](trace, application);
  }

  // default trace label
  return makeDefaultTraceLabel(trace, application);
}