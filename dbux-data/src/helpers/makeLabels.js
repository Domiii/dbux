import { newLogger } from '@dbux/common/src/log/logger';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import AsyncEventUpdateType, { isPostEventUpdate } from '@dbux/common/src/types/constants/AsyncEventUpdateType';
import ExecutionContextType, { isResumeType } from '@dbux/common/src/types/constants/ExecutionContextType';

/** @typedef {import('@dbux/common/src/types/ExecutionContext').default} ExecutionContext */
/** @typedef {import('../applications/Application').default} Application */
/** @typedef {import('../applications/allApplications').default} AllApplications */
/** @typedef {import('../RuntimeDataProvider').default} RuntimeDataProvider */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('makeLabels');

/**
 * hackfix: break dependency cycle
 * NOTE: this terrible, non-modular design needs fixing in the long run.
 * @type {AllApplications}
 */
let _allApplications;

export function initTraceLabels(allApplications) {
  _allApplications = allApplications;
}

// ###########################################################################
// Trace Labels
// ###########################################################################

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
    return `✧ ${makeDefaultTraceLabel(trace, application)}`;
  },
  [TraceType.ExpressionResult](trace, application) {
    return `${makeDefaultTraceLabel(trace, application)} ✦`;
  },
  [TraceType.CallbackArgument](trace, application) {
    return `ƒ ${makeDefaultTraceLabel(trace, application)}`;
  },
  [TraceType.BlockStart](/* trace, application */) {
    // const context = application.dataProvider.collections.executionContexts.getById(trace.contextId);
    return `↳`;
  },
  [TraceType.BlockEnd](/* trace, application */) {
    // const context = application.dataProvider.collections.executionContexts.getById(trace.contextId);
    return `⤴`;
  },
  [TraceType.Await](trace, application) {
    const awaitArgumentTrace = application.dataProvider.collections.traces.getById(trace.traceId - 1);
    return 'await ' + makeTraceLabel(awaitArgumentTrace);
  },
};

/**
 * General purpose trace label maker, able to deal with different types of traces
 * @param {Trace} trace 
 * @returns 
 */
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

// ########################################
// special labels
// ########################################

/**
 * Make label that shows the value of trace, use `makeCallValueLabel` when it's a call-related trace.
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

  const argsTraces = dp.util.getCallArgTraces(traceId) || EmptyArray;
  const argValues = argsTraces.map(arg => dp.util.getTraceValueStringShort(arg.traceId));
  const resultValue = resultId && dp.util.getTraceValueStringShort(resultId, true);
  const result = resultValue && ` -> ${resultValue}` || '';
  const str = `(${argValues.join(', ')})${result}`;
  return str;
}

// ########################################
// loc (location) labels
// ########################################

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

export function makeStaticTraceLocLabel(dp, staticTrace) {
  const fileName = dp.util.getStaticTraceFileName(staticTrace.staticTraceId);
  const { loc } = staticTrace;
  const { line/* , column */ } = loc.start;
  // return `@${fileName}:${line}:${column}`;
  return `${fileName}:${line}`;
}

// ###########################################################################
// Context Labels
// ###########################################################################

/**
 * @param {Application} app 
 * @return {string}
 */
export function makeStaticContextLabel(staticContextId, app) {
  const dp = app.dataProvider;
  const staticContext = dp.collections.staticContexts.getById(staticContextId);
  return `${staticContext.displayName}`;
}

/**
 * @param {ExecutionContext} context 
 * @param {Application} app 
 * @return {string}
 */
export function makeContextLabel(context, app) {
  const { contextId, contextType: type } = context;
  const dp = app.dataProvider;
  const realStaticContextId = dp.util.getRealStaticContextIdOfContext(contextId);

  if (isResumeType(type)) {
    const firstTrace = dp.indexes.traces.byContext.getFirst(contextId);
    if (firstTrace) {
      const staticTrace = firstTrace && dp.collections.staticTraces.getById(firstTrace.staticTraceId);
      let virtualLabel;
      if (ExecutionContextType.is.ResumeAsync(type)) {
        if (staticTrace.displayName?.match(/^await /)) {
          // displayName = staticTrace.displayName.replace('await ', '').replace(/\([^(]*\)$/, '');
          virtualLabel = staticTrace.displayName.replace('await ', '').replace(/;$/, '');
        }
        else {
          virtualLabel = '';
        }
      }
      else {
        // yield
        if (staticTrace.displayName?.match(/^yield /)) {
          // displayName = staticTrace.displayName.replace('await ', '').replace(/\([^(]*\)$/, '');
          virtualLabel = staticTrace.displayName.replace('yield ', '').replace(/;$/, '');
        }
        else {
          virtualLabel = '*';
        }
      }
      return `${makeStaticContextLabel(realStaticContextId, app)}${virtualLabel ? `| ${virtualLabel}` : ''}`;
    }
    else {
      // bug: could not find any of the context's traces
    }
  }

  return makeStaticContextLabel(realStaticContextId, app);
}

const ContextCallerLabelByEventUpdateType = {
  [AsyncEventUpdateType.PostAwait]: () => 'await',
  [AsyncEventUpdateType.PostThen]: () => 'then',
  [AsyncEventUpdateType.PostCallback]: (context, dp) => {
    const asyncNode = dp.indexes.asyncNodes.byRoot.getUnique(context.contextId);

    /**
     * NOTE: CB scheduler trace is usually a BCE or one of its arguments.
     */
    const trace = asyncNode && asyncNode.schedulerTraceId &&
      dp.util.getCalleeTrace(asyncNode.schedulerTraceId) ||
      dp.util.getCallRelatedTraceBCE(asyncNode.schedulerTraceId) ||
      dp.util.getTrace(asyncNode.schedulerTraceId);
    return trace && makeTraceLabel(trace) || '(unknown callback)';
  }
};

/**
 * @param {ExecutionContext} rootContext 
 * @param {RuntimeDataProvider} dp 
 * @return {string}
 */
export function makeContextSchedulerLabel(rootContext, dp) {
  const { contextId } = rootContext;
  const asyncEventUpdates = dp.indexes.asyncEventUpdates.byRoot.get(contextId);
  // one POST event per `rootId`
  const postEventUpdates = asyncEventUpdates?.filter(({ type }) => isPostEventUpdate(type)) || EmptyArray;
  if (postEventUpdates.length === 1) {
    return ContextCallerLabelByEventUpdateType[postEventUpdates[0].type](rootContext, dp);
  }
  else if (postEventUpdates.length > 1) {
    // sanity check
    warn(`Found rootContextId with non-unique postEventUpdates. context: ${rootContext}, postEventUpdates: ${postEventUpdates}`);
  }
  return '';
}

// ########################################
// loc (location) labels
// ########################################

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

  const packageName = dp.util.getStaticContextPackageName(staticContextId);
  const moduleLabel = packageName ? `${packageName} | ` : '';

  return `${moduleLabel}${fileName}:${line}`;
}