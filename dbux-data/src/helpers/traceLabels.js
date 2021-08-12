import TraceType, { isCallbackRelatedTrace } from '@dbux/common/src/types/constants/TraceType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { makeContextLabel } from './contextLabels';


/**
 * hackfix: break dependency cycle
 * NOTE: this terrible, non-modular design needs fixing in the long run.
 */
let _allApplications;

export function initTraceLabels(allApplications) {
  _allApplications = allApplications;
}

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
  const dp = application.dataProvider;
  const { traceId } = trace;
  if (dp.util.isTraceArgument(traceId)) {
    const callerTrace = dp.util.getRelatedBCEStaticTrace(traceId);
    if (callerTrace) {
      return `   (arg of ${callerTrace.displayName})`;
    }
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
  [TraceType.BlockStart](/* trace, application */) {
    // const context = application.dataProvider.collections.executionContexts.getById(trace.contextId);
    return `↳`;
  },
  [TraceType.BlockEnd](/* trace, application */) {
    // const context = application.dataProvider.collections.executionContexts.getById(trace.contextId);
    return `⤴`;
  }
};

export function makeTraceLabel(trace) {
  const {
    traceId
  } = trace;

  const application = _allApplications.getById(trace.applicationId);

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

  // trim and replace many whitespaces with only one
  return label.trim().replace(/\s+/g, ' ');
}


/**
 * Returns time, relative to some time origin.
 *  TODO: get time relative to global time origin, not per-application time origin
 *      ideally: starting time of first application in set.
 */
export function getTraceCreatedAt(trace) {
  const application = _allApplications.getById(trace.applicationId);
  const { createdAt, dataProvider } = application;
  const context = dataProvider.util.getTraceContext(trace.traceId);
  return (context.createdAt - createdAt) / 1000;
}

export function makeRootTraceLabel(trace) {
  const { traceId, applicationId } = trace;
  const dp = _allApplications.getById(applicationId).dataProvider;
  const traceType = dp.util.getTraceType(traceId);
  let label;
  if (isCallbackRelatedTrace(traceType)) {
    label = makeTraceValueLabel(trace);
  }
  else {
    label = makeTraceLabel(trace);
  }
  return label;
}

// ###########################################################################
// Value labels
// ###########################################################################

/**
 * Make label that shows the value of trace, or `callValueLabel` of call trace
 * @param {Trace} trace 
 */
export function makeTraceValueLabel(trace) {
  const { applicationId, traceId } = trace;
  const dp = _allApplications.getById(applicationId).dataProvider;
  // const callTrace = dp.util.getBCETraceOfTrace(traceId);

  if (dp.util.isBCETrace(traceId)) {
    // BCE
    return makeCallValueLabel(trace);
  }
  else if (dp.util.isCallResultTrace(traceId)) {
    //call result
    const bceTrace = dp.util.getBCETraceOfTrace(traceId);
    return makeCallValueLabel(bceTrace);
  }
  else if (dp.util.doesTraceHaveValue(traceId)) {
    // trace has value
    return dp.util.getTraceValueString(traceId);
  }
  else {
    // default trace
    return makeTraceLabel(trace);
  }
}

/**
 * Make label that shows the params and return value of call trace
 * @param {Trace} bceTrace
 */
export function makeCallValueLabel(bceTrace) {
  const { applicationId, traceId, resultId } = bceTrace;
  const dp = _allApplications.getById(applicationId).dataProvider;

  const args = dp.indexes.traces.byCall.get(traceId) || EmptyArray;
  const argValues = args.slice(1).map(arg => dp.util.getTraceValueStringShort(arg.traceId));
  const resultValue = resultId && dp.util.getTraceValueStringShort(resultId);
  const result = resultValue && ` -> ${resultValue}` || '';
  const str = `(${argValues.join(', ')})${result}`;
  return str;
}

// ###########################################################################
// loc (location) labels
// ###########################################################################


export function makeContextLocLabel(applicationId, context) {
  const { staticContextId } = context;
  return makeStaticContextLocLabel(applicationId, staticContextId);
}

export function makeStaticContextLocLabel(applicationId, staticContextId) {
  const dp = _allApplications.getById(applicationId).dataProvider;
  const { programId, loc } = dp.collections.staticContexts.getById(staticContextId);
  const fileName = programId && dp.collections.staticProgramContexts.getById(programId).fileName || null;

  // TODO: incorrect loc, when used in VSCode?
  const { line/* , column */ } = loc.start;
  // return `@${fileName}:${line}:${column}`;
  return `${fileName}:${line}`;
}

export function makeTraceLocLabel(trace) {
  const {
    traceId,
    applicationId
  } = trace;

  const dp = _allApplications.getById(applicationId).dataProvider;
  const fileName = dp.util.getTraceFileName(traceId);
  const loc = dp.util.getTraceLoc(traceId);

  const { line/* , column */ } = loc.start;
  // return `@${fileName}:${line}:${column}`;
  return `${fileName}:${line}`;
}