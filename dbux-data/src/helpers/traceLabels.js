import TraceType, { isCallbackRelatedTrace } from 'dbux-common/src/core/constants/TraceType';
import { EmptyArray } from 'dbux-common/src/util/arrayUtil';
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
    return `   (arg of ${calleeTrace.displayName})`;
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

  let label;

  // custom by-type label
  const traceType = application.dataProvider.util.getTraceType(traceId);
  if (byType[traceType]) {
    label = byType[traceType](trace, application);
  }
  else {
    // default trace label
    label = makeDefaultTraceLabel(trace, application);
  }

  return label.trim();
}


/**
 * Returns time, relative to some time origin.
 *  TODO: get time relative to global time origin, not per-application time origin
 *      ideally: starting time of first application in set.
 */
export function getTraceCreatedAt(trace) {
  const application = allApplications.getById(trace.applicationId);
  const { createdAt, dataProvider } = application;
  const context = dataProvider.util.getTraceContext(trace.traceId);
  return (context.createdAt - createdAt) / 1000;
}

export function makeRootTraceLabel(trace) {
  const { traceId, applicationId } = trace;
  const dp = allApplications.getById(applicationId).dataProvider;
  const traceType = dp.util.getTraceType(traceId);
  let label;
  if (isCallbackRelatedTrace(traceType)) {
    label = makeCallTraceLabel(trace);
  }
  else {
    label = makeTraceLabel(trace);
  }
  return label;
}

export function makeCallTraceLabel(trace) {
  const { traceId, applicationId, contextId } = trace;
  const dp = allApplications.getById(applicationId).dataProvider;
  const traceType = dp.util.getTraceType(traceId);
  let label;
  if (traceType === TraceType.PushCallback) {
    const context = dp.collections.executionContexts.getById(contextId);
    const schedulerTrace = dp.collections.traces.getById(context.schedulerTraceId);
    label = makeCallTraceLabel(schedulerTrace);
  }
  else if (traceType === TraceType.PopCallback) {
    const schedulerTrace = dp.collections.trace.getById(trace.schedulerTraceId);
    label = makeCallTraceLabel(schedulerTrace);
  }
  else if (traceType === TraceType.CallArgument) {
    const { callId } = trace;

    const args = dp.indexes.traces.callArgsByCall.get(callId);
    const argValues = args?.
      map(argTrace => dp.util.getTraceValue(argTrace.traceId)) ||
      EmptyArray;
    
    const valueString = dp.util.getTraceValue(traceId) + ' ';
    label = `(${argValues.join(', ')}) -> ${valueString}`;
  }
  else {
    // not a callRelatedTrace
    label = makeTraceLabel(trace);
  }
  return label;
}